export interface IPTVChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  groupTitle: string;
}

export function parseM3U(content: string): IPTVChannel[] {
  const lines = content.split('\n');
  const channels: IPTVChannel[] = [];
  let currentChannel: Partial<IPTVChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#EXTM3U')) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse metadata using regex for better accuracy
      // Standard format: #EXTINF:-1 tvg-id="ID" tvg-logo="URL" group-title="Group",Channel Name
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const idMatch = line.match(/tvg-id="([^"]*)"/);

      const parsedId = idMatch ? idMatch[1] : '';
      
      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        groupTitle: groupMatch ? groupMatch[1] : 'General',
        category: groupMatch ? groupMatch[1] : 'General',
        // Ensure ID is never empty and relatively unique if missing
        id: parsedId || Math.random().toString(36).substring(2, 11),
      };
    } else if (line.startsWith('#')) {
      // Skip other metadata tags like #EXTVLCOPT, #EXTGRP, etc.
      continue;
    } else if (line.startsWith('http') || line.includes('://')) {
      // Stream URL - only process if we have a pending channel name from an #EXTINF line
      if (currentChannel.name) {
        currentChannel.url = line;
        // Final sanity check for ID uniqueness within this specific parse run
        const finalId = currentChannel.id || Math.random().toString(36).substring(2, 11);
        channels.push({
          ...currentChannel,
          id: finalId,
        } as IPTVChannel);
        currentChannel = {};
      }
    }
  }

  return channels;
}
