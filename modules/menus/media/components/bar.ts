import { playerManager, updateTrigger } from "../media.js";

const Bar = () => {
  return Widget.Box({
    class_name: "media-indicator-current-progress-bar",
    hexpand: true,
    children: [
      Widget.Box({
        hexpand: true,
        child: Widget.Slider({
          hexpand: true,
          tooltip_text: "--",
          class_name: "menu-slider media progress",
          draw_value: false,
          on_change: ({ value }) => {
            const player = playerManager.getActivePlayer();
            if (player) {
              player.position = value * (player.length || 0);
            }
          },
          setup: (self) => {
            const update = () => {
              const player = playerManager.getActivePlayer();
              if (player) {
                const value = player.length
                  ? player.position / player.length
                  : 0;
                self.value = value > 0 ? value : 0;
              } else {
                self.value = 0;
              }
            };

            const updateTooltip = () => {
              const player = playerManager.getActivePlayer();
              if (!player) {
                self.tooltip_text = "00:00";
                return;
              }

              const position = player.position || 0;
              const curHour = Math.floor(position / 3600);
              const curMin = Math.floor((position % 3600) / 60);
              const curSec = Math.floor(position % 60);

              if (position >= 0) {
                self.tooltip_text = `${
                  curHour > 0
                    ? (curHour < 10 ? "0" + curHour : curHour) + ":"
                    : ""
                }${curMin < 10 ? "0" + curMin : curMin}:${
                  curSec < 10 ? "0" + curSec : curSec
                }`;
              } else {
                self.tooltip_text = "00:00";
              }
            };

            self.hook(updateTrigger, () => {
              update();
              updateTooltip();
            });

            self.poll(1000, () => {
              update();
              updateTooltip();
              return true;
            });
          },
        }),
      }),
    ],
  });
};

export { Bar };
