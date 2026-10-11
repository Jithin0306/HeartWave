using System;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Threading;

namespace HeartWave
{
    class Program
    {
        const string MMF_NAME = "OBSVirtualCamVideo";
        const uint STATE_STARTING = 1;
        const uint STATE_READY = 2;
        const uint STATE_STOPPING = 3;

        static void Main(string[] args)
        {
            uint width = 1280;
            uint height = 720;
            uint fps = 30;

            if (args.Length >= 2)
            {
                uint.TryParse(args[0], out width);
                uint.TryParse(args[1], out height);
            }
            if (args.Length >= 3)
            {
                uint.TryParse(args[2], out fps);
            }

            ulong interval = 10000000UL / (ulong)Math.Max(1, fps);
            uint frameSize = width * height * 3 / 2; // NV12 size
            uint frameHeaderSize = 32;
            uint frameSlotSize = frameSize + frameHeaderSize;

            uint headerSize = 96; // 76 aligned to 32
            uint offset0 = headerSize;
            uint offset1 = offset0 + frameSlotSize;
            uint offset2 = offset1 + frameSlotSize;
            long totalSize = offset2 + frameSlotSize;

            Console.WriteLine(string.Format("[HeartWaveBridge] Initializing {0}x{1} @ {2}fps. Buffer: {3} bytes.", width, height, fps, totalSize));

            try
            {
                using (var mmf = MemoryMappedFile.CreateOrOpen(MMF_NAME, totalSize, MemoryMappedFileAccess.ReadWrite))
                using (var accessor = mmf.CreateViewAccessor(0, totalSize, MemoryMappedFileAccess.ReadWrite))
                {
                    // 1. Initialize queue_header
                    accessor.Write(0, (uint)0); // write_idx
                    accessor.Write(4, (uint)0); // read_idx
                    accessor.Write(8, STATE_READY); // state = READY
                    accessor.Write(12, offset0);
                    accessor.Write(16, offset1);
                    accessor.Write(20, offset2);
                    accessor.Write(24, (uint)0); // type = VIDEO
                    accessor.Write(28, width);
                    accessor.Write(32, height);
                    accessor.Write(36, (uint)0);   // 4-byte padding for 64-bit struct alignment
                    accessor.Write(40, interval);  // 64-bit uint64 interval in MSVC struct queue_header

                    uint[] offsets = new uint[] { offset0, offset1, offset2 };
                    uint writeIdx = 0;

                    // Prepare an elegant default Heartwave branded NV12 slate
                    // Y: 24 (luxury dark #141211), UV: 132/126 (rose-gold tint)
                    byte[] nv12Buffer = new byte[frameSize];
                    int ySize = (int)(width * height);
                    for (int i = 0; i < ySize; i++)
                    {
                        nv12Buffer[i] = 26; // Dark luxury base
                    }
                    // Add subtle horizontal vignette in Y plane
                    for (int y = 0; y < height; y++)
                    {
                        for (int x = 0; x < width; x++)
                        {
                            int dx = (int)x - (int)width / 2;
                            int dy = (int)y - (int)height / 2;
                            int distSq = dx * dx + dy * dy;
                            int radiusSq = (int)(height * height / 3);
                            if (distSq < radiusSq)
                            {
                                int idx = (int)(y * width + x);
                                nv12Buffer[idx] = (byte)Math.Min(65, 26 + (radiusSq - distSq) * 35 / radiusSq);
                            }
                        }
                    }
                    for (int i = ySize; i < frameSize; i += 2)
                    {
                        nv12Buffer[i] = 132;     // U (champagne/rose tint)
                        nv12Buffer[i + 1] = 126; // V
                    }

                    Console.WriteLine("[HeartWaveBridge] Ready. Streaming to DirectShow Virtual Camera...");

                    // Streaming loop: 30 FPS
                    Stream stdin = Console.OpenStandardInput();
                    byte[] stdinBuffer = new byte[frameSize];
                    bool useStdin = false;

                    // If stdin has bytes piped from Node.js, read them; otherwise keep pumping luxury slate
                    var streamThread = new Thread(() =>
                    {
                        try
                        {
                            while (true)
                            {
                                int read = 0;
                                while (read < frameSize)
                                {
                                    int n = stdin.Read(stdinBuffer, read, (int)frameSize - read);
                                    if (n <= 0) break;
                                    read += n;
                                }
                                if (read == frameSize)
                                {
                                    useStdin = true;
                                    lock (nv12Buffer)
                                    {
                                        Buffer.BlockCopy(stdinBuffer, 0, nv12Buffer, 0, (int)frameSize);
                                    }
                                }
                            }
                        }
                        catch { }
                    })
                    { IsBackground = true };
                    streamThread.Start();

                    while (true)
                    {
                        long timestamp = DateTime.UtcNow.Ticks;
                        uint currentOffset = offsets[writeIdx];

                        // Write frame header timestamp (uint64 at offset)
                        accessor.Write(currentOffset, (ulong)timestamp);

                        // Write frame pixel data (at offset + 32)
                        lock (nv12Buffer)
                        {
                            accessor.WriteArray(currentOffset + 32, nv12Buffer, 0, (int)frameSize);
                        }

                        // Update write_idx and ensure state is READY
                        writeIdx = (writeIdx + 1) % 3;
                        accessor.Write(0, writeIdx);
                        accessor.Write(8, STATE_READY);

                        Thread.Sleep(33); // ~30.3 FPS
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(string.Format("[HeartWaveBridge Error] {0}", ex.Message));
            }
        }
    }
}
