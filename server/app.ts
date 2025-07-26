import express from "express";
import { statSync, createReadStream, existsSync } from "fs";
import { join } from "path";
import cors from "cors";

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

type DiscordTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

app.use(
  cors({
    origin: [
      "https://discord.com",
      "https://canary.discord.com",
      "https://ptb.discord.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public"));

const VIDEO_PATH = join(
  process.cwd(),
  "movies",
  "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster).mp4"
);

app.get("/", (req, res) => {
  res.sendFile(join(process.cwd(), "public", "index.html"));
});

app.get("/api/video/stream", (req, res) => {
  try {
    if (!existsSync(VIDEO_PATH)) {
      return res.status(404).json({ error: "Video file not found" });
    }

    const stat = statSync(VIDEO_PATH);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");

      if (!parts[0]) {
        return res.status(400).json({ error: "Invalid Range header" });
      }

      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = createReadStream(VIDEO_PATH, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      };

      res.writeHead(200, head);
      createReadStream(VIDEO_PATH).pipe(res);
    }
  } catch (error) {
    console.error("Video streaming error:", error);
    res.status(500).json({ error: "Failed to stream video" });
  }
});

app.get("/api/auth/discord/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: requireEnv("DISCORD_APPLICATION_ID"),
        client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: `${requireEnv("BASE_URL")}/api/auth/discord/callback`,
      }),
    });

    const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;

    if (tokenData.access_token) {
      res.redirect(`/?token=${tokenData.access_token}`);
    } else {
      res.status(400).json({ error: "Failed to get access token" });
    }
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    videoExists: existsSync(VIDEO_PATH),
    videoPath: VIDEO_PATH,
    runtime: "bun",
  });
});

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
);

const server = app.listen(PORT, () => {
  console.log(`🎬 Video streaming server running on http://localhost:${PORT}`);
  console.log(`📹 Video file: ${VIDEO_PATH}`);
  console.log(`✅ Video exists: ${existsSync(VIDEO_PATH)}`);
  console.log(`⚡ Runtime: Bun ${Bun.version}`);

  if (process.env.NODE_ENV !== "production") {
    console.log("⚠️  Note: Discord Activities require HTTPS in production!");
  }
});

function requireEnv(varName: string): string {
  const value = process.env[varName];
  if (!value) throw new Error(`Missing environment variable: ${varName}`);
  return value;
}

export default server;
