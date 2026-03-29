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
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse metadata using regex for better accuracy
      // Standard format: #EXTINF:-1 tvg-id="ID" tvg-logo="URL" group-title="Group",Channel Name
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const idMatch = line.match(/tvg-id="([^"]*)"/);

      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        groupTitle: groupMatch ? groupMatch[1] : 'General',
        category: groupMatch ? groupMatch[1] : 'General',
        id: idMatch ? idMatch[1] : Math.random().toString(36).substr(2, 9),
      };
    } else if (line.startsWith('http') || line.includes('://')) {
      // Stream URL
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as IPTVChannel);
        currentChannel = {};
      }
    }
  }

  return channels;
}
