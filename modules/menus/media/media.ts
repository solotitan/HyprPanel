import options from "options.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { MprisPlayer } from "types/service/mpris.ts";
import { PlayerManager } from "./PlayerManager.ts";
import { PlayerSelector } from "./PlayerSelector.ts";
import { Bar } from "./components/bar.js";
import { Controls } from "./components/controls.js";
import { MediaInfo } from "./components/mediainfo.js";
import { DEBUG } from "./debugConfig.ts";

const log = (message: string, ...args: any[]) => {
  if (DEBUG.ALL || DEBUG.MEDIA) {
    console.log(`[MEDIA] ${message}`, ...args);
  }
};

const mpris = await Service.import("mpris");
export const playerManager = new PlayerManager(mpris);
const activePlayer = Variable<MprisPlayer | null>(null);
const updateTrigger = Variable(0);
const { theme } = options;

const updateActivePlayer = () => {
  const newActivePlayer = playerManager.getActivePlayer();
  if (newActivePlayer !== activePlayer.value) {
    activePlayer.value = newActivePlayer;
    updateTrigger.value += 1;
  }
};

const updateAll = () => {
  updateActivePlayer();
  updateTrigger.value += 1;
};

mpris.connect("changed", updateAll);
playerManager.addListener(updateAll);

const getPlayerInfo = () => playerManager.getActivePlayer() || null;

const generateAlbumArt = (imageUrl: string): string => {
  const { tint, color } = theme.bar.menus.menu.media.card;
  const userTint = tint.value;
  const userHexColor = color.value;

  const r = parseInt(userHexColor.slice(1, 3), 16);
  const g = parseInt(userHexColor.slice(3, 5), 16);
  const b = parseInt(userHexColor.slice(5, 7), 16);

  const alpha = userTint / 100;

  return `
    background-image: linear-gradient(
      rgba(${r}, ${g}, ${b}, ${alpha}),
      rgba(${r}, ${g}, ${b}, ${alpha}),
      ${userHexColor} 65em
    ), url("${imageUrl}");
    background-size: cover;
    background-position: center;
  `;
};

const Media = () => {
  return Widget.Box({
    class_name: "menu-section-container",
    vertical: true,
    css: `
      margin: 0.25em;
    `,
    children: [
      Widget.Box({
        class_name: "menu-items-section",
        vertical: false,
        child: Widget.Box({
          class_name: "menu-content media-content",
          setup: (self) => {
            self.hook(updateTrigger, () => {
              const player = playerManager.getActivePlayer();
              if (player) {
                self.css = generateAlbumArt(player.track_cover_url || "");
              }
            });

            options.handler(["theme.bar.menus.menu.media.card"], () => {
              const player = getPlayerInfo();
              if (player) {
                self.css = generateAlbumArt(player.track_cover_url || "");
              }
            });
          },
          child: Widget.Box({
            class_name: "media-indicator-right-section",
            hpack: "fill",
            hexpand: true,
            vertical: true,
            children: [
              MediaInfo(),
              Controls(),
              Bar(),
              Widget.Box({
                css: `
                  min-height: 10px;
                `,
              }),
              PlayerSelector(),
            ],
          }),
        }),
      }),
    ],
    setup: (self) => {
      const updateAllComponents = () => {
        log("Updating all media widget components");
        updateTrigger.value += 1;
      };

      playerManager.addListener(updateAllComponents);

      self.connect("destroy", () => {
        playerManager.removeListener(updateAllComponents);
      });
    },
  });
};

export { Media, activePlayer, updateTrigger };
