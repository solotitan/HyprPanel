import { playerManager, updateTrigger } from "../media.ts";

const mpris = await Service.import("mpris");

const MediaInfo = () => {
  return Widget.Box({
    class_name: "media-indicator-current-media-info",
    hpack: "center",
    hexpand: true,
    vertical: true,
    children: [
      Widget.Box({
        class_name: "media-indicator-current-song-name",
        hpack: "center",
        children: [
          Widget.Label({
            truncate: "end",
            max_width_chars: 31,
            wrap: true,
            class_name: "media-indicator-current-song-name-label",
            setup: (self) => {
              const updateLabel = () => {
                const activePlayer = playerManager.getActivePlayer();
                self.label = activePlayer
                  ? activePlayer.track_title || "No title"
                  : "No active player";
              };
              updateLabel();
              self.hook(updateTrigger, updateLabel);
              self.poll(1000, updateLabel);
              playerManager.addListener(updateLabel);
              self.connect("destroy", () => {
                playerManager.removeListener(updateLabel);
              });
            },
          }),
        ],
      }),
      Widget.Box({
        class_name: "media-indicator-current-song-author",
        hpack: "center",
        children: [
          Widget.Label({
            truncate: "end",
            wrap: true,
            max_width_chars: 35,
            class_name: "media-indicator-current-song-author-label",
            setup: (self) => {
              self.hook(updateTrigger, () => {
                const artists = playerManager.getTrackArtists();
                self.label = artists.length ? artists.join(", ") : "-----";
              });
            },
          }),
        ],
      }),
      Widget.Box({
        class_name: "media-indicator-current-song-album",
        hpack: "center",
        children: [
          Widget.Label({
            truncate: "end",
            wrap: true,
            max_width_chars: 40,
            class_name: "media-indicator-current-song-album-label",
            setup: (self) => {
              self.hook(updateTrigger, () => {
                self.label = playerManager.getTrackAlbum();
              });
            },
          }),
        ],
      }),
    ],
  });
};

export { MediaInfo };
