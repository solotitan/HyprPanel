import { MprisPlayer } from "types/service/mpris.js";
import { DEBUG } from "./debugConfig";

const log = (message: string, ...args: any[]) => {
  if (DEBUG.ALL || DEBUG.MEDIA) {
    console.log(`[MEDIA] ${message}`, ...args);
  }
};

export class PlayerManager {
  private players: Map<string, MprisPlayer> = new Map();
  private activePlayer: string | null = null;
  private lastSelectedPlayer: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor(private mpris: any) {
    this.initializePlayers();
    this.setupListeners();
  }

  private emitChange() {
    this.listeners.forEach((callback) => callback());
  }

  private initializePlayers() {
    this.mpris.players.forEach((player: MprisPlayer) => {
      this.addPlayer(player);
    });
    this.updateActivePlayer();
  }

  private setupListeners() {
    this.mpris.connect("player-added", (_: any, busName: string) =>
      this.onPlayerAdded(busName)
    );
    this.mpris.connect("player-closed", (_: any, busName: string) =>
      this.onPlayerClosed(busName)
    );
    this.mpris.connect("changed", () => this.updateActivePlayer());
  }

  private onPlayerAdded(busName: string) {
    const player = this.mpris.getPlayer(busName);
    if (player) {
      this.addPlayer(player);
      this.updateActivePlayer();
    }
  }

  private onPlayerClosed(busName: string) {
    this.removePlayer(busName);
    this.updateActivePlayer();
  }

  private addPlayer(player: MprisPlayer) {
    this.players.set(player.bus_name, player);
    player.connect("changed", () => this.notifyListeners());
  }

  private removePlayer(busName: string) {
    this.players.delete(busName);
  }

  public updateActivePlayer() {
    const statusOrder = { Playing: 1, Paused: 2, Stopped: 3 };
    let newActivePlayer = this.lastSelectedPlayer;

    // If last selected player is not available, find the best candidate
    if (!newActivePlayer || !this.players.has(newActivePlayer)) {
      const sortedPlayers = Array.from(this.players.values())
        .filter((player) => player !== null)
        .sort(
          (a, b) =>
            statusOrder[a.play_back_status] - statusOrder[b.play_back_status]
        );

      newActivePlayer =
        sortedPlayers.length > 0 ? sortedPlayers[0].bus_name : null;
    }

    if (newActivePlayer !== this.activePlayer) {
      this.activePlayer = newActivePlayer;
      this.notifyListeners();
    }
  }

  public getActivePlayers(): MprisPlayer[] {
    return Array.from(this.players.values());
  }

  public getActivePlayer(): MprisPlayer | null {
    if (this.activePlayer && this.players.has(this.activePlayer)) {
      return this.players.get(this.activePlayer) || null;
    }
    return null;
  }

  public setActivePlayer(busName: string) {
    if (this.players.has(busName)) {
      this.activePlayer = busName;
      this.lastSelectedPlayer = busName;
      log(`Successfully set active player to: ${busName}`);
      this.notifyListeners(); // This will trigger updates
    } else {
      log(`Attempted to set non-existent player as active: ${busName}`);
    }
  }

  // New methods to access player properties
  public getActivePlayerProperty(property: string): any {
    const player = this.getActivePlayer();
    return player ? player[property] : null;
  }

  public getTrackTitle(): string {
    return (
      this.getActivePlayerProperty("track_title") ||
      "No Media Currently Playing"
    );
  }

  public getTrackArtists(): string[] {
    return this.getActivePlayerProperty("track_artists") || [];
  }

  public getTrackAlbum(): string {
    return this.getActivePlayerProperty("track_album") || "---";
  }

  public getTrackCoverUrl(): string {
    return this.getActivePlayerProperty("track_cover_url") || "";
  }

  public addListener(callback: () => void) {
    this.listeners.add(callback);
  }

  public removeListener(callback: () => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }
}

export default PlayerManager;
