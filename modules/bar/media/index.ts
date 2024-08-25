import Gdk from "gi://Gdk?version=3.0";
import options from "options";
import { playerManager, updateTrigger } from "../../menus/media/media.ts";
import { openMenu } from "../utils.js";

const { show_artist, truncation, truncation_size, show_label } =
  options.bar.media;

const Media = () => {
  const getIconForPlayer = (playerName: string | null): string => {
    if (!playerName) return "󰝚";

    const windowTitleMap = [
      ["Firefox", "󰈹"],
      ["Microsoft Edge", "󰇩"],
      ["Discord", ""],
      ["Plex", "󰚺"],
      ["Spotify", "󰓇"],
      ["(.*)", "󰝚"],
    ];

    const foundMatch = windowTitleMap.find((wt) =>
      RegExp(wt[0], "i").test(playerName)
    );

    return foundMatch ? foundMatch[1] : "󰝚";
  };

  const songIcon = Variable("");

  const mediaLabel = Utils.watch(
    "Media",
    [updateTrigger, show_artist, truncation, truncation_size, show_label],
    () => {
      const activePlayer = playerManager.getActivePlayer();
      if (activePlayer && show_label.value) {
        const { track_title, identity, track_artists } = activePlayer;
        songIcon.value = getIconForPlayer(identity);
        const trackArtist =
          show_artist.value && track_artists
            ? ` - ${track_artists.join(", ")}`
            : ``;
        const truncatedLabel =
          truncation.value && track_title
            ? `${track_title + trackArtist}`.substring(0, truncation_size.value)
            : `${track_title + trackArtist}`;

        return track_title && track_title.length > 0
          ? truncatedLabel.length < truncation_size.value || !truncation.value
            ? `${truncatedLabel}`
            : `${truncatedLabel.substring(0, truncatedLabel.length - 3)}...`
          : `No media playing...`;
      } else {
        songIcon.value = getIconForPlayer(activePlayer?.identity || null);
        return `Media`;
      }
    }
  );

  return {
    component: Widget.Box({
      visible: false,
      child: Widget.Box({
        className: Utils.merge(
          [
            options.theme.bar.buttons.style.bind("value"),
            show_label.bind("value"),
          ],
          (style, showLabel) => {
            const styleMap = {
              default: "style1",
              split: "style2",
              wave: "style3",
            };
            return `media ${styleMap[style]}`;
          }
        ),
        child: Widget.Box({
          children: [
            Widget.Label({
              class_name: "bar-button-icon media txt-icon bar",
              label: songIcon.bind("value").as((v) => v || "󰝚"),
            }),
            Widget.Label({
              class_name: "bar-button-label media",
              label: mediaLabel,
            }),
          ],
        }),
      }),
    }),
    isVisible: false,
    boxClass: "media",
    name: "media",
    props: {
      on_scroll_up: () => playerManager.getActivePlayer()?.next(),
      on_scroll_down: () => playerManager.getActivePlayer()?.previous(),
      on_primary_click: (clicked: any, event: Gdk.Event) => {
        openMenu(clicked, event, "mediamenu");
      },
    },
  };
};

export { Media };
