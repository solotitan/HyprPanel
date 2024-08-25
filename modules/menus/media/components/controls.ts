import { MprisPlayer } from "types/service/mpris.js";
import icons from "../../../icons/index.js";
import { playerManager, updateTrigger } from "../media.js";

const Controls = () => {
  const isLoopActive = (player: MprisPlayer | null) => {
    return player?.loop_status &&
      ["Track", "Playlist"].includes(player.loop_status)
      ? "active"
      : "";
  };

  const isShuffleActive = (player: MprisPlayer | null) => {
    return player?.shuffle_status === true ? "active" : "";
  };

  const createControlButton = (
    iconName: string,
    action: (player: MprisPlayer) => void,
    getClassName: (player: MprisPlayer | null) => string,
    getTooltip: (player: MprisPlayer | null) => string | null,
    getIcon: (player: MprisPlayer | null) => string
  ) => {
    return Widget.Button({
      hpack: "center",
      hasTooltip: true,
      setup: (self) => {
        self.hook(updateTrigger, () => {
          const player = playerManager.getActivePlayer();
          if (!player) {
            self.tooltip_text = "Unavailable";
            self.class_name = `${getClassName(null)} disabled`;
            return;
          }

          self.tooltip_text = getTooltip(player);
          self.on_primary_click = () => action(player);
          self.class_name = getClassName(player);
        });
      },
      child: Widget.Icon({
        setup: (self) => {
          self.hook(updateTrigger, () => {
            const player = playerManager.getActivePlayer();
            self.icon = getIcon(player);
          });
        },
      }),
    });
  };

  return Widget.Box({
    class_name: "media-indicator-current-player-controls",
    vertical: true,
    children: [
      Widget.Box({
        class_name: "media-indicator-current-controls",
        hpack: "center",
        children: [
          createControlButton(
            "shuffle",
            (player) => {
              // Toggle shuffle state
              if (typeof player.shuffle === "function") {
                player.shuffle();
              } else {
                console.warn("Shuffle function not available on this player");
              }
            },
            (player) =>
              `media-indicator-control-button shuffle ${isShuffleActive(
                player
              )} ${player?.shuffle_status !== null ? "enabled" : "disabled"}`,
            (player) => (player?.shuffle_status ? "Shuffle On" : "Shuffle Off"),
            () => icons.mpris.shuffle["enabled"]
          ),
          createControlButton(
            "prev",
            (player) => player.previous(),
            (player) =>
              `media-indicator-control-button prev ${
                player?.can_go_prev ? "enabled" : "disabled"
              }`,
            () => null,
            () => icons.mpris.prev
          ),
          createControlButton(
            "play",
            (player) => player.playPause(),
            (player) =>
              `media-indicator-control-button play ${
                player?.can_play ? "enabled" : "disabled"
              }`,
            () => null,
            (player) =>
              icons.mpris[player?.play_back_status.toLowerCase() || "paused"]
          ),
          createControlButton(
            "next",
            (player) => player.next(),
            (player) =>
              `media-indicator-control-button next ${
                player?.can_go_next ? "enabled" : "disabled"
              }`,
            () => null,
            () => icons.mpris.next
          ),
          createControlButton(
            "loop",
            (player) => player.loop(),
            (player) =>
              `media-indicator-control-button loop ${isLoopActive(player)} ${
                player?.loop_status !== null ? "enabled" : "disabled"
              }`,
            (player) => player?.loop_status || "None",
            (player) =>
              icons.mpris.loop[player?.loop_status?.toLowerCase() || "none"]
          ),
        ],
      }),
    ],
  });
};

export { Controls };
