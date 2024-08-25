import Gdk from "../../../types/@girs/gdk-3.0/gdk-3.0";
import { DEBUG } from "./debugConfig";
import { activePlayer, playerManager, updateTrigger } from "./media";

const log = (message: string, ...args: any[]) => {
  if (DEBUG.ALL || DEBUG.MEDIA) {
    console.log(`[MEDIA] ${message}`, ...args);
  }
};

const getPlayerIcon = (identity: string): string => {
  const iconMap: { [key: string]: string } = {
    Spotify: "\uf1bc",
    Firefox: "\uf269",
    mpv: "\uf03d",
    chromium: "\uf268",
    vlc: "\uf03d",
    audacious: "\uf001",
    rhythmbox: "\uf001",
  };

  // Fallback icons using standard Unicode characters
  const fallbackIconMap: { [key: string]: string } = {
    Spotify: "🎵",
    Firefox: "🦊",
    mpv: "🎞️",
    chromium: "🌐",
    vlc: "🎞️",
    audacious: "🎵",
    rhythmbox: "🎵",
  };

  // Default icon if no match is found
  const defaultIcon = "\uf001";

  for (const [key, icon] of Object.entries(iconMap)) {
    if (identity.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }

  return defaultIcon;
};

const createPlayerBox = (icon: string, text: string) => {
  return Widget.Box({
    children: [
      Widget.Label({
        label: icon + " ",
        css: 'font-family: "Nerd Font", monospace; margin-right: 8px;',
      }),
      Widget.Label({
        label: text,
      }),
    ],
  });
};

export const PlayerSelector = () => {
  const menu = Widget.Menu({
    class_name: "player-selection-menu",
  });

  const updateMenu = () => {
    const players = playerManager.getActivePlayers();
    menu.children = players.map((player) =>
      Widget.MenuItem({
        child: createPlayerBox(getPlayerIcon(player.identity), player.identity),
        onActivate: () => {
          try {
            playerManager.setActivePlayer(player.bus_name);
            log(`Switched to player: ${player.identity}`);
          } catch (error) {
            log(`Error switching to player ${player.identity}:`, error);
          }
        },
      })
    );
  };

  const switchPlayer = (direction: "next" | "previous") => {
    const players = playerManager.getActivePlayers();
    const currentIndex = players.findIndex(
      (p) => p.bus_name === activePlayer.value?.bus_name
    );
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % players.length;
    } else {
      newIndex = (currentIndex - 1 + players.length) % players.length;
    }

    const newPlayer = players[newIndex];
    if (newPlayer) {
      playerManager.setActivePlayer(newPlayer.bus_name);
      log(`Switched to player: ${newPlayer.identity}`);
    }
  };

  return Widget.Box({
    class_name: "player-selector",
    hpack: "center",
    css: `
      margin-top: 10px;
      margin-bottom: 5px;
    `,
    children: [
      Widget.Button({
        hpack: "center",
        child: createPlayerBox("\uf001", "Select Player"),
        setup: (self) => {
          self.hook(updateTrigger, () => {
            const activePlayer = playerManager.getActivePlayer();
            if (activePlayer) {
              self.label =
                getPlayerIcon(activePlayer.identity) +
                " " +
                activePlayer.identity;
            } else {
              self.label = "No active player";
            }
            updateMenu();
          });
        },
        onClicked: (button) => {
          updateMenu();
          menu.popup_at_widget(
            button,
            Gdk.Gravity.SOUTH,
            Gdk.Gravity.NORTH,
            null
          );
        },
        on_scroll_up: () => switchPlayer("next"),
        on_scroll_down: () => switchPlayer("previous"),
      }),
    ],
  });
};

export default PlayerSelector;
