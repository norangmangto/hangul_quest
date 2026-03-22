import { create } from 'zustand';
import type { GameSettings } from '@hangul-quest/shared';

export type Lang = 'en' | 'ko' | 'de';

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    // Meta
    tagline: 'Learn Korean while playing!',
    dark_toggle_title: 'Toggle dark mode',

    // Main menu
    single_play: 'Single Play',
    single_play_desc: 'Solo practice — learn at your own pace, no timer pressure',
    multi_play: 'Multi Play',
    multi_play_desc: 'Play with friends in real-time — create or join a room',
    weak_spots_banner: (n: number) =>
      `🔴 ${n} weak spot${n !== 1 ? 's' : ''} — practice in Single Play to improve! →`,
    back: '← Back',

    // Multi play
    create_room_tab: '🏠 Create Room',
    join_room_tab: '🚀 Join Room',
    your_name: 'Your Name',
    name_placeholder: 'Enter your name...',
    room_code: 'Room Code',
    room_code_placeholder: 'e.g. ABCD',
    err_name_required: 'Please enter your name',
    err_code_required: 'Please enter a room code',
    err_connect: 'Cannot connect to server. Is it running?',
    connecting: '⏳ Connecting...',
    create_room_btn: '🏠 Create Room',
    join_room_btn: '🚀 Join Room',

    // Practice
    solo_practice: 'Solo Practice',
    solo_practice_desc: 'Practice Korean at your own pace — no pressure, no timer!',
    weak_spots_count: (n: number) => `You have ${n} weak spot${n !== 1 ? 's' : ''}`,
    weak_spots_hint: 'Practice weak spots to improve your accuracy',
    ws_korean_words: '🔴 Weak Spots: Korean Words',
    ws_hangul_letters: '🔴 Weak Spots: Hangul Letters',
    cat_korean_words: '📖 Korean Words (15 rounds)',
    cat_hangul_letters: '🔤 Hangul Letters (15 rounds)',
    progress: (cur: number, tot: number) => `${cur} / ${tot}`,
    exit: '← Exit',
    correct_answer: 'Correct Answer',
    next: 'Next →',
    see_results: 'See Results',
    practice_done: 'Practice Done!',
    correct_count: (score: number, total: number) => `${score} / ${total} correct`,
    practice_again: '🔄 Practice Again',
    change_category: '← Change Category',
    back_home: 'Back to Home',

    // Room — lobby (host)
    room_code_label: 'Room Code',
    copy_link: '🔗 Copy invite link',
    link_copied: '✓ Link copied!',
    settings: '⚙️ Settings',
    category: 'Category',
    game_mode: 'Game Mode',
    answer_mode: 'Answer Mode',
    mode_standard: '🎮 Standard',
    mode_teams: '🔴🔵 Teams',
    mode_elimination: '💀 Elimination',
    mode_buttons: '🔲 Buttons',
    mode_typed: '⌨️ Typed',
    rounds_label: (n: number) => `Rounds: ${n}`,
    time_label: (n: number) => `Time: ${n}s`,
    auto_advance_label: (n: number) => `Auto-advance: ${n === 0 ? 'Off' : `${n}s`}`,
    auto_advance_hint: 'Automatically start next round after result',
    players_label: (cur: number, max: number) => `👥 Players (${cur}/${max})`,
    assign_teams_hint: 'Assign teams before starting:',
    waiting_players: 'Waiting for players to join...',
    start_game: '🎮 Start Game!',
    close_room: '✕ Close Room',

    // Room — lobby (player)
    hosted_by: (name: string) => `Hosted by ${name}`,
    waiting_start: 'waiting for host to start...',

    // Room — game
    round_of: (cur: number, tot: number) => `Round ${cur} / ${tot}`,
    scores: '🏆 Scores',
    next_round: 'Next Round →',
    auto_in: (n: number) => `(auto in ${n}s)`,
    play_again: '🔄 Play Again',
    game_over: '🎉 Game Over!',
    final_rankings: 'Final Rankings',
    team_scores: 'Team Scores',
    red_wins: '🔴 Red Wins!',
    blue_wins: '🔵 Blue Wins!',
    tie: '🤝 Tie!',
    close: '✕ Close',
    pronounce: '🔊 Pronounce',
    you_got_it: '🏆 You got it!',
    player_got_it: (name: string) => `${name} got it!`,
    times_up: "⏰ Time's up!",
    type_placeholder: 'Type your answer...',
    submit: 'Submit',
    waiting_others: 'Waiting for others...',
    waiting_host: 'Waiting for host...',
    leave: '← Leave',
    reconnecting: 'Reconnecting...',
    reconnect_hint: "Hang tight, we'll get you back in!",
    eliminated_title: 'Eliminated!',
    eliminated_desc: 'You answered incorrectly.',
    eliminated_watch: 'Watch the rest of the game...',
    remaining_players: 'Remaining Players',
    finished_rank: (n: number) => `You finished #${n}`,
    pts: (n: number) => `${n} pts`,
    connecting_msg: 'Connecting...',
    go_back_home: 'go back home',

    // Category labels
    cat_label: (cat: GameSettings['category']): string => {
      switch (cat) {
        case 'KOREAN_WORDS':    return '📖 Korean Words';
        case 'HANGUL_LETTERS':  return '🔤 Hangul Letters';
        case 'KOREAN_VERBS':    return '🏃 Korean Verbs';
        case 'KOREAN_TO_ENGLISH': return '🌐 Korean → English';
        case 'KOREAN_NUMBERS':  return '🔢 Korean Numbers';
        case 'KOREAN_SENTENCES': return '💬 Korean Sentences';
      }
    },
  },

  ko: {
    tagline: '게임으로 한국어를 배우세요!',
    dark_toggle_title: '다크 모드 전환',

    single_play: '혼자 하기',
    single_play_desc: '혼자 연습 — 내 속도로, 타이머 없이',
    multi_play: '같이 하기',
    multi_play_desc: '친구와 실시간으로 — 방 만들기 또는 참여',
    weak_spots_banner: (n: number) => `🔴 취약점 ${n}개 — 혼자 하기에서 연습해 보세요! →`,
    back: '← 뒤로',

    create_room_tab: '🏠 방 만들기',
    join_room_tab: '🚀 방 참여',
    your_name: '내 이름',
    name_placeholder: '이름을 입력하세요...',
    room_code: '방 코드',
    room_code_placeholder: '예: ABCD',
    err_name_required: '이름을 입력해 주세요',
    err_code_required: '방 코드를 입력해 주세요',
    err_connect: '서버에 연결할 수 없습니다. 서버가 실행 중인가요?',
    connecting: '⏳ 연결 중...',
    create_room_btn: '🏠 방 만들기',
    join_room_btn: '🚀 방 참여',

    solo_practice: '혼자 연습',
    solo_practice_desc: '내 속도로 한국어 연습 — 압박 없이, 타이머 없이!',
    weak_spots_count: (n: number) => `취약점이 ${n}개 있어요`,
    weak_spots_hint: '취약점을 연습해서 실력을 키우세요',
    ws_korean_words: '🔴 취약점: 한국어 단어',
    ws_hangul_letters: '🔴 취약점: 한글 자모',
    cat_korean_words: '📖 한국어 단어 (15라운드)',
    cat_hangul_letters: '🔤 한글 자모 (15라운드)',
    progress: (cur: number, tot: number) => `${cur} / ${tot}`,
    exit: '← 나가기',
    correct_answer: '정답',
    next: '다음 →',
    see_results: '결과 보기',
    practice_done: '연습 완료!',
    correct_count: (score: number, total: number) => `${total}개 중 ${score}개 정답`,
    practice_again: '🔄 다시 연습',
    change_category: '← 카테고리 변경',
    back_home: '홈으로',

    room_code_label: '방 코드',
    copy_link: '🔗 초대 링크 복사',
    link_copied: '✓ 복사됨!',
    settings: '⚙️ 설정',
    category: '카테고리',
    game_mode: '게임 모드',
    answer_mode: '답 입력 방식',
    mode_standard: '🎮 일반',
    mode_teams: '🔴🔵 팀전',
    mode_elimination: '💀 탈락',
    mode_buttons: '🔲 버튼',
    mode_typed: '⌨️ 타이핑',
    rounds_label: (n: number) => `라운드: ${n}`,
    time_label: (n: number) => `시간: ${n}초`,
    auto_advance_label: (n: number) => `자동 진행: ${n === 0 ? '끄기' : `${n}초`}`,
    auto_advance_hint: '결과 후 자동으로 다음 라운드 시작',
    players_label: (cur: number, max: number) => `👥 플레이어 (${cur}/${max})`,
    assign_teams_hint: '시작 전에 팀을 배정하세요:',
    waiting_players: '플레이어를 기다리는 중...',
    start_game: '🎮 게임 시작!',
    close_room: '✕ 방 닫기',

    hosted_by: (name: string) => `호스트: ${name}`,
    waiting_start: '호스트가 시작하기를 기다리는 중...',

    round_of: (cur: number, tot: number) => `${cur} / ${tot} 라운드`,
    scores: '🏆 점수',
    next_round: '다음 라운드 →',
    auto_in: (n: number) => `(${n}초 후 자동)`,
    play_again: '🔄 다시 하기',
    game_over: '🎉 게임 종료!',
    final_rankings: '최종 순위',
    team_scores: '팀 점수',
    red_wins: '🔴 레드팀 승리!',
    blue_wins: '🔵 블루팀 승리!',
    tie: '🤝 무승부!',
    close: '✕ 닫기',
    pronounce: '🔊 발음',
    you_got_it: '🏆 정답!',
    player_got_it: (name: string) => `${name} 정답!`,
    times_up: '⏰ 시간 초과!',
    type_placeholder: '답을 입력하세요...',
    submit: '제출',
    waiting_others: '다른 플레이어를 기다리는 중...',
    waiting_host: '호스트를 기다리는 중...',
    leave: '← 나가기',
    reconnecting: '재연결 중...',
    reconnect_hint: '잠시만 기다려 주세요!',
    eliminated_title: '탈락!',
    eliminated_desc: '오답을 선택했습니다.',
    eliminated_watch: '나머지 게임을 관전하세요...',
    remaining_players: '남은 플레이어',
    finished_rank: (n: number) => `${n}등으로 완주했어요`,
    pts: (n: number) => `${n}점`,
    connecting_msg: '연결 중...',
    go_back_home: '홈으로 돌아가기',

    cat_label: (cat: GameSettings['category']): string => {
      switch (cat) {
        case 'KOREAN_WORDS':    return '📖 한국어 단어';
        case 'HANGUL_LETTERS':  return '🔤 한글 자모';
        case 'KOREAN_VERBS':    return '🏃 한국어 동사';
        case 'KOREAN_TO_ENGLISH': return '🌐 한국어 → 영어';
        case 'KOREAN_NUMBERS':  return '🔢 한국어 숫자';
        case 'KOREAN_SENTENCES': return '💬 한국어 문장';
      }
    },
  },

  de: {
    tagline: 'Lerne Koreanisch beim Spielen!',
    dark_toggle_title: 'Dunkel-Modus umschalten',

    single_play: 'Einzelspieler',
    single_play_desc: 'Solo-Übung — lerne in deinem eigenen Tempo, ohne Zeitdruck',
    multi_play: 'Mehrspieler',
    multi_play_desc: 'Spiele mit Freunden — erstelle oder trete einem Raum bei',
    weak_spots_banner: (n: number) =>
      `🔴 ${n} Schwachstelle${n !== 1 ? 'n' : ''} — im Einzelspieler üben! →`,
    back: '← Zurück',

    create_room_tab: '🏠 Raum erstellen',
    join_room_tab: '🚀 Raum beitreten',
    your_name: 'Dein Name',
    name_placeholder: 'Namen eingeben...',
    room_code: 'Raumcode',
    room_code_placeholder: 'z.B. ABCD',
    err_name_required: 'Bitte gib deinen Namen ein',
    err_code_required: 'Bitte gib einen Raumcode ein',
    err_connect: 'Keine Verbindung zum Server. Läuft er?',
    connecting: '⏳ Verbinde...',
    create_room_btn: '🏠 Raum erstellen',
    join_room_btn: '🚀 Raum beitreten',

    solo_practice: 'Solo-Übung',
    solo_practice_desc: 'Übe Koreanisch in deinem Tempo — kein Druck, kein Timer!',
    weak_spots_count: (n: number) =>
      `Du hast ${n} Schwachstelle${n !== 1 ? 'n' : ''}`,
    weak_spots_hint: 'Übe Schwachstellen, um dich zu verbessern',
    ws_korean_words: '🔴 Schwachstellen: Koreanische Wörter',
    ws_hangul_letters: '🔴 Schwachstellen: Hangul-Buchstaben',
    cat_korean_words: '📖 Koreanische Wörter (15 Runden)',
    cat_hangul_letters: '🔤 Hangul-Buchstaben (15 Runden)',
    progress: (cur: number, tot: number) => `${cur} / ${tot}`,
    exit: '← Beenden',
    correct_answer: 'Richtige Antwort',
    next: 'Weiter →',
    see_results: 'Ergebnisse',
    practice_done: 'Übung abgeschlossen!',
    correct_count: (score: number, total: number) => `${score} / ${total} richtig`,
    practice_again: '🔄 Nochmal üben',
    change_category: '← Kategorie ändern',
    back_home: 'Zur Startseite',

    room_code_label: 'Raumcode',
    copy_link: '🔗 Einladungslink kopieren',
    link_copied: '✓ Kopiert!',
    settings: '⚙️ Einstellungen',
    category: 'Kategorie',
    game_mode: 'Spielmodus',
    answer_mode: 'Antwortmodus',
    mode_standard: '🎮 Standard',
    mode_teams: '🔴🔵 Teams',
    mode_elimination: '💀 Elimination',
    mode_buttons: '🔲 Buttons',
    mode_typed: '⌨️ Tippen',
    rounds_label: (n: number) => `Runden: ${n}`,
    time_label: (n: number) => `Zeit: ${n}s`,
    auto_advance_label: (n: number) => `Auto-Weiter: ${n === 0 ? 'Aus' : `${n}s`}`,
    auto_advance_hint: 'Nächste Runde nach Ergebnis automatisch starten',
    players_label: (cur: number, max: number) => `👥 Spieler (${cur}/${max})`,
    assign_teams_hint: 'Teams vor dem Start zuweisen:',
    waiting_players: 'Warte auf Spieler...',
    start_game: '🎮 Spiel starten!',
    close_room: '✕ Raum schließen',

    hosted_by: (name: string) => `Gastgeber: ${name}`,
    waiting_start: 'Warte darauf, dass der Gastgeber startet...',

    round_of: (cur: number, tot: number) => `Runde ${cur} / ${tot}`,
    scores: '🏆 Punkte',
    next_round: 'Nächste Runde →',
    auto_in: (n: number) => `(auto in ${n}s)`,
    play_again: '🔄 Nochmal spielen',
    game_over: '🎉 Spiel vorbei!',
    final_rankings: 'Endrangliste',
    team_scores: 'Teampunkte',
    red_wins: '🔴 Rotes Team gewinnt!',
    blue_wins: '🔵 Blaues Team gewinnt!',
    tie: '🤝 Unentschieden!',
    close: '✕ Schließen',
    pronounce: '🔊 Aussprache',
    you_got_it: '🏆 Richtig!',
    player_got_it: (name: string) => `${name} hat es!`,
    times_up: '⏰ Zeit abgelaufen!',
    type_placeholder: 'Antwort eingeben...',
    submit: 'Absenden',
    waiting_others: 'Warte auf andere...',
    waiting_host: 'Warte auf Gastgeber...',
    leave: '← Verlassen',
    reconnecting: 'Verbinde neu...',
    reconnect_hint: 'Einen Moment bitte!',
    eliminated_title: 'Ausgeschieden!',
    eliminated_desc: 'Du hast falsch geantwortet.',
    eliminated_watch: 'Schau dir den Rest des Spiels an...',
    remaining_players: 'Verbleibende Spieler',
    finished_rank: (n: number) => `Du belegst Platz ${n}`,
    pts: (n: number) => `${n} Pkt.`,
    connecting_msg: 'Verbinde...',
    go_back_home: 'zur Startseite',

    cat_label: (cat: GameSettings['category']): string => {
      switch (cat) {
        case 'KOREAN_WORDS':    return '📖 Koreanische Wörter';
        case 'HANGUL_LETTERS':  return '🔤 Hangul-Buchstaben';
        case 'KOREAN_VERBS':    return '🏃 Koreanische Verben';
        case 'KOREAN_TO_ENGLISH': return '🌐 Koreanisch → Englisch';
        case 'KOREAN_NUMBERS':  return '🔢 Koreanische Zahlen';
        case 'KOREAN_SENTENCES': return '💬 Koreanische Sätze';
      }
    },
  },
} as const;

export type Translations = typeof T.en;

// ─── Zustand store ────────────────────────────────────────────────────────────

type LangStore = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  hydrate: () => void;
};

export const useLangStore = create<LangStore>((set) => ({
  lang: 'en',
  setLang: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('hq:lang', lang);
    set({ lang });
  },
  hydrate: () => {
    const stored = localStorage.getItem('hq:lang') as Lang | null;
    if (stored) set({ lang: stored });
  },
}));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useT(): Translations {
  const lang = useLangStore(s => s.lang);
  return T[lang] as unknown as Translations;
}
