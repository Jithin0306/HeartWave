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
        const string EVENT_NAME = "HeartWaveNewFrameEvent";
        const uint HW_MAGIC = 0x48574156;       // 'HWAV'
        const uint HW_FRAME_MAGIC = 0x52465748; // 'HWFR'

        unsafe static void RgbaToNv12(byte* pRgba, byte* pNv12, int width, int height)
        {
            int ySize = width * height;
            byte* pY = pNv12;
            byte* pUV = pNv12 + ySize;

            System.Threading.Tasks.Parallel.For(0, height, y =>
            {
                byte* localY = pY + y * width;
                byte* localUV = pUV + (y / 2) * width;
                int rowStart = y * width * 4;
                bool isEvenRow = (y & 1) == 0;

                for (int x = 0; x < width; x++)
                {
                    int rgbaIdx = rowStart + (x << 2);
                    byte r = pRgba[rgbaIdx];
                    byte g = pRgba[rgbaIdx + 1];
                    byte b = pRgba[rgbaIdx + 2];

                    // Standard Rec. 601 RGB to YUV matrix
                    localY[x] = (byte)(((66 * r + 129 * g + 25 * b + 128) >> 8) + 16);

                    if (isEvenRow && (x & 1) == 0)
                    {
                        localUV[x] = (byte)(((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128);
                        localUV[x + 1] = (byte)(((112 * r - 94 * g - 18 * b + 128) >> 8) + 128);
                    }
                }
            });
        }

        static void Main(string[] args)
        {
            try
            {
                System.Diagnostics.Process.GetCurrentProcess().PriorityClass = System.Diagnostics.ProcessPriorityClass.AboveNormal;
            }
            catch { }

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

            uint nv12Size = width * height * 3 / 2;
            uint headerSize = 64;

            // Pre-allocate buffer large enough for 1080p if needed
            uint maxNv12Size = Math.Max(nv12Size, 1920 * 1080 * 3 / 2);
            long totalSize = headerSize + maxNv12Size;

            Console.WriteLine(string.Format("[HeartWaveBridge] Initializing {0}x{1} @ {2}fps low-latency pipeline ({3} bytes buffer)", width, height, fps, totalSize));

            try
            {
                using (var newFrameEvent = new EventWaitHandle(false, EventResetMode.AutoReset, EVENT_NAME))
                using (var mmf = MemoryMappedFile.CreateOrOpen(MMF_NAME, totalSize, MemoryMappedFileAccess.ReadWrite))
                using (var accessor = mmf.CreateViewAccessor(0, totalSize, MemoryMappedFileAccess.ReadWrite))
                {
                    // 1. Initialize HeartWaveSharedHeader
                    accessor.Write(0, HW_MAGIC);      // magic 'HWAV'
                    accessor.Write(4, (uint)1);       // version 1
                    accessor.Write(8, width);         // width
                    accessor.Write(12, height);       // height
                    accessor.Write(16, (uint)0);      // format = NV12
                    accessor.Write(20, (uint)0);      // writeIndex
                    accessor.Write(24, (ulong)DateTime.UtcNow.Ticks); // timestamp
                    accessor.Write(32, nv12Size);     // frameSize
                    accessor.Write(36, (uint)0);      // isPrivacyMuted

                    // Prepare luxury dark rose default NV12 frame
                    byte[] nv12Buffer = new byte[maxNv12Size];
                    int ySize = (int)(width * height);
                    for (int i = 0; i < ySize; i++) nv12Buffer[i] = 26; // Luxury dark #141211
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
                    for (int i = ySize; i < nv12Size; i += 2)
                    {
                        nv12Buffer[i] = 132;     // U
                        nv12Buffer[i + 1] = 126; // V
                    }

                    accessor.WriteArray(headerSize, nv12Buffer, 0, (int)nv12Size);
                    Console.WriteLine("[HeartWaveBridge] Ready. Awaiting live frames on stdin...");

                    // High-throughput 4MB buffer for standard input
                    Stream stdin = Console.OpenStandardInput(4 * 1024 * 1024);
                    byte[] stdinBuffer = new byte[1920 * 1080 * 4];
                    byte[] workNv12 = new byte[maxNv12Size];
                    byte[] headerBuf = new byte[12];
                    uint writeIdx = 0;
                    object bufferLock = new object();
                    int telemetryFrames = 0;
                    long lastTelemetryTicks = DateTime.UtcNow.Ticks;

                    var streamThread = new Thread(() =>
                    {
                        try
                        {
                            while (true)
                            {
                                int hRead = 0;
                                while (hRead < 12)
                                {
                                    int n = stdin.Read(headerBuf, hRead, 12 - hRead);
                                    if (n <= 0) return;
                                    hRead += n;
                                }

                                uint magic = BitConverter.ToUInt32(headerBuf, 0);
                                uint frameW, frameH;
                                int payloadRead = 0;

                                if (magic == HW_FRAME_MAGIC)
                                {
                                    frameW = BitConverter.ToUInt32(headerBuf, 4);
                                    frameH = BitConverter.ToUInt32(headerBuf, 8);
                                    payloadRead = 0;
                                }
                                else
                                {
                                    // Raw mode: the 12 bytes are the start of RGBA
                                    frameW = width;
                                    frameH = height;
                                    Buffer.BlockCopy(headerBuf, 0, stdinBuffer, 0, 12);
                                    payloadRead = 12;
                                }

                                if (frameW == 0 || frameH == 0 || frameW > 3840 || frameH > 2160)
                                {
                                    continue;
                                }

                                uint frameRgbaSize = frameW * frameH * 4;
                                uint frameNv12Size = frameW * frameH * 3 / 2;

                                if (stdinBuffer.Length < frameRgbaSize)
                                {
                                    stdinBuffer = new byte[frameRgbaSize];
                                }
                                if (workNv12.Length < frameNv12Size)
                                {
                                    workNv12 = new byte[frameNv12Size];
                                }

                                while (payloadRead < frameRgbaSize)
                                {
                                    int n = stdin.Read(stdinBuffer, payloadRead, (int)frameRgbaSize - payloadRead);
                                    if (n <= 0) return;
                                    payloadRead += n;
                                }

                                unsafe
                                {
                                    fixed (byte* pRgba = stdinBuffer, pNv = workNv12)
                                    {
                                        RgbaToNv12(pRgba, pNv, (int)frameW, (int)frameH);
                                    }
                                }

                                // Write directly to MMF immediately - 0ms latency event-driven update!
                                long timestamp = DateTime.UtcNow.Ticks;
                                lock (bufferLock)
                                {
                                    accessor.WriteArray(headerSize, workNv12, 0, (int)frameNv12Size);
                                    accessor.Write(8, frameW);
                                    accessor.Write(12, frameH);
                                    accessor.Write(32, frameNv12Size);
                                    writeIdx++;
                                    accessor.Write(20, writeIdx);
                                    accessor.Write(24, (ulong)timestamp);
                                }

                                // Signal DirectShow filter that a fresh frame is ready!
                                newFrameEvent.Set();

                                telemetryFrames++;
                                long nowTicks = DateTime.UtcNow.Ticks;
                                if (nowTicks - lastTelemetryTicks >= 10000000)
                                {
                                    Console.WriteLine(string.Format("[Bridge Native] Pipe Read & Written: {0} fps, Total Index: {1}", telemetryFrames, writeIdx));
                                    telemetryFrames = 0;
                                    lastTelemetryTicks = nowTicks;
                                }
                            }
                        }
                        catch { }
                    })
                    { IsBackground = true, Priority = ThreadPriority.AboveNormal };
                    streamThread.Start();

                    // Heartbeat loop to keep timestamp fresh even if paused
                    while (streamThread.IsAlive)
                    {
                        long ts = DateTime.UtcNow.Ticks;
                        accessor.Write(24, (ulong)ts);
                        Thread.Sleep(500);
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
