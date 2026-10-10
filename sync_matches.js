async function syncMatches() {
  const { default: fetch } = await import('node-fetch');
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_HANDLE = "IndianSuperLeague";
  const FIREBASE_PROJECT_ID = "m-livesports-tv-app";

  try {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error("YouTube Channel not found");
      return;
    }
    const channelId = channelData.items[0].id;

    // Fetching Live Streams
    const liveRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`);
    const liveData = await liveRes.json();

    if (liveData.items) {
      for (let item of liveData.items) {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '';
        const streamUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        const matchId = `yt-live-${videoId}`;
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/matches/${matchId}?key=${YOUTUBE_API_KEY}`;
        
        const fields = {
          id: { stringValue: matchId },
          tournamentName: { stringValue: "Indian Super League" },
          sport: { stringValue: "football" },
          category: { stringValue: "live" },
          team1: { stringValue: title },
          team2: { stringValue: "ISL Broadcast" },
          team1Flag: { stringValue: thumbnail },
          team2Flag: { stringValue: "" },
          date: { stringValue: new Date().toISOString() },
          streamUrl: { stringValue: streamUrl },
          statusText: { stringValue: "LIVE NOW" },
          createdAt: { integerValue: Date.now() }
        };

        await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        });
      }
      console.log("Successfully synced live streams.");
    }

    // Fetching Upcoming Matches
    const upcomingRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=upcoming&type=video&key=${YOUTUBE_API_KEY}`);
    const upcomingData = await upcomingRes.json();

    if (upcomingData.items) {
      for (let item of upcomingData.items) {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '';
        const streamUrl = `https://www.youtube.com/embed/${videoId}`;
        const matchId = `yt-upcoming-${videoId}`;
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/matches/${matchId}?key=${YOUTUBE_API_KEY}`;
        
        const fields = {
          id: { stringValue: matchId },
          tournamentName: { stringValue: "Indian Super League" },
          sport: { stringValue: "football" },
          category: { stringValue: "upcoming" },
          team1: { stringValue: title },
          team2: { stringValue: "ISL Broadcast" },
          team1Flag: { stringValue: thumbnail },
          team2Flag: { stringValue: "" },
          date: { stringValue: new Date().toISOString() },
          streamUrl: { stringValue: streamUrl },
          statusText: { stringValue: "UPCOMING" },
          createdAt: { integerValue: Date.now() }
        };

        await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        });
      }
      console.log("Successfully synced upcoming streams.");
    }

  } catch (error) {
    console.error("Sync Error:", error.message);
  }
}

syncMatches();
