using System;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Threading;

namespace HeartWave
{
    class Program
    {
        const string MMF_NAME = "HeartWaveSharedVideo";
        const uint HW_MAGIC = 0x48574156; // 'HWAV'

        static void Main(string[] args)
        {
            uint width = 1920;
            uint height = 1080;
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
            uint frameSize = width * height * 3 / 2; // NV12
            uint headerSize = 64;
            long totalSize = headerSize + frameSize;

            Console.WriteLine(string.Format("[HeartWaveBridge] Starting Heartwave Video Pipeline {0}x{1} @ {2}fps ({3} bytes)", width, height, fps, totalSize));

            try
            {
                using (var mmf = MemoryMappedFile.CreateOrOpen(MMF_NAME, totalSize, MemoryMappedFileAccess.ReadWrite))
                using (var accessor = mmf.CreateViewAccessor(0, totalSize, MemoryMappedFileAccess.ReadWrite))
                {
                    // Initialize HeartWaveSharedHeader
                    accessor.Write(0, HW_MAGIC);      // magic
                    accessor.Write(4, (uint)1);       // version
                    accessor.Write(8, width);         // width
                    accessor.Write(12, height);       // height
                    accessor.Write(16, (uint)0);      // format = 0 (NV12)
                    accessor.Write(20, (uint)0);      // writeIndex
                    accessor.Write(24, (ulong)0);     // timestamp
                    accessor.Write(32, frameSize);    // frameSize
                    accessor.Write(36, (uint)0);      // isPrivacyMuted

                    // Prepare an elegant luxury dark rose NV12 base frame
                    byte[] nv12Buffer = new byte[frameSize];
                    int ySize = (int)(width * height);
                    for (int i = 0; i < ySize; i++)
                    {
                        nv12Buffer[i] = 26; // Luxury dark #141211
                    }
                    int cx = (int)width / 2;
                    int cy = (int)height / 2;
                    int rSq = (int)(height * height / 4);
                    for (int y = 0; y < height; y++)
                    {
                        for (int x = 0; x < width; x++)
                        {
                            int dx = x - cx;
                            int dy = y - cy;
                            int dSq = dx * dx + dy * dy;
                            if (dSq < rSq)
                            {
                                nv12Buffer[y * width + x] = (byte)(26 + (rSq - dSq) * 35 / rSq);
                            }
                        }
                    }
                    for (int i = ySize; i < frameSize; i += 2)
                    {
                        nv12Buffer[i] = 132;     // U (rose-gold tint)
                        nv12Buffer[i + 1] = 126; // V
                    }

                    // Write initial frame
                    accessor.WriteArray(headerSize, nv12Buffer, 0, (int)frameSize);

                    Console.WriteLine("[HeartWaveBridge] Ready. Streaming frames to DirectShow Virtual Camera...");

                    // Streaming thread reading from stdin if available
                    Stream stdin = Console.OpenStandardInput();
                    byte[] stdinBuffer = new byte[frameSize];
                    bool useStdin = false;

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

                    uint writeIdx = 0;
                    while (true)
                    {
                        long timestamp = DateTime.UtcNow.Ticks;
                        lock (nv12Buffer)
                        {
                            accessor.WriteArray(headerSize, nv12Buffer, 0, (int)frameSize);
                        }

                        writeIdx++;
                        accessor.Write(20, writeIdx);
                        accessor.Write(24, (ulong)timestamp);

                        Thread.Sleep(33); // ~30 FPS
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
