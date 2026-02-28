// data.js

// ゲームデータの統合オブジェクト
const gameData = {
    artists: [
        {
            id: 'art-blakey',
            name: 'Art Blakey',
            instrument: 'drums',
            songs: [ 'blakey-moanin' ]
        },
        {
            id: 'bill-evans',
            name: 'Bill Evans',
            instrument: 'piano',
            songs: [
                'bill-evans-waltz-for-debby-1',
                'bill-evans-alice-in-wonderland',
                'bill-evans-autumn-leaves'
            ]
        },
        {
            id: 'cannonball-adderley',
            name: 'Cannonball Adderley',
            instrument: 'saxophone',
            songs: [
                'cannonball-autumn-leaves-1',
                'cannonball-adderley-high-fly',
                'cannonball-adderley-star-eyes',
                'cannonball-adderley-this-here'
            ]
        },
        {
            id: 'charles-mingus',
            name: 'Charles Mingus',
            instrument: 'bass',
            songs: [ 'mingus-goodbye-pork-pie-hat' ]
        },
        {
            id: 'charlie-parker',
            name: 'Charlie Parker',
            instrument: 'saxophone',
            songs: [
                'parker-now-is-the-time',
                'charlie-parker-an-oscar-for-treadwell-1',
                'charlie-parker-another-hair-do-1',
                'charlie-parker-anthropology-1',
                'charlie-parker-au-privave-2',
                'charlie-parker-au-privave-3',
                'charlie-parker-back-home-blues',
                'charlie-parker-barbados',
                'charlie-parker-billies-bounce',
                'charlie-parker-bird-gets-the-worm',
                'charlie-parker-bloomdido',
                'charlie-parker-blue-bird',
                'charlie-parker-blues-for-alice',
                'charlie-parker-buzzy',
                'charlie-parker-card-board',
                'charlie-parker-celerity',
                'charlie-parker-chasing-the-bird',
                'charlie-parker-cheryl',
                'charlie-parker-chi-chi',
                'charlie-parker-confirmation',
                'charlie-parker-cosmic-rays',
                'charlie-parker-dewey-square',
                'charlie-parker-diverse',
                'charlie-parker-donna-lee',
                'charlie-parker-kc-blues',
                'charlie-parker-kim-1',
                'charlie-parker-kim-2',
                'charlie-parker-ko-ko',
                'charlie-parker-laird-baird',
                'charlie-parker-marmaduke',
                'charlie-parker-mohawk-1',
                'charlie-parker-mohawk-2',
                'charlie-parker-moose-the-mooche',
                'charlie-parker-my-little-suede-shoes',
                'charlie-parker-nows-the-time-1',
                'charlie-parker-nows-the-time-2',
                'charlie-parker-ornithology',
                'charlie-parker-passport',
                'charlie-parker-perhaps',
                'charlie-parker-red-cross',
                'charlie-parker-relaxing-with-lee',
                'charlie-parker-scrapple-from-the-apple',
                'charlie-parker-segment',
                'charlie-parker-shaw-nuff',
                'charlie-parker-si-si',
                'charlie-parker-steeplechase',
                'charlie-parker-the-bird',
                'charlie-parker-thriving-from-a-riff',
                'charlie-parker-visa',
                'charlie-parker-warming-up-a-riff',
                'charlie-parker-yardbird-suite'
            ]
        },
        {
            id: 'chet-baker',
            name: 'Chet Baker',
            instrument: 'trumpet',
            songs: [
                'chet-baker-i-fall-in-love-too-easily',
                'chet-baker-just-friends',
                'chet-baker-lets-get-lost',
                'chet-baker-long-ago-and-far-away',
                'chet-baker-there-will-never-be-another-you'
            ]
        },
        {
            id: 'clifford-brown',
            name: 'Clifford Brown',
            instrument: 'trumpet',
            songs: [
                'clifford-brown-a-night-in-tunisia',
                'clifford-brown-daahoud',
                'clifford-brown-ill-remember-april',
                'clifford-brown-jordu',
                'clifford-brown-joy-spring',
                'clifford-brown-sandu',
                'clifford-brown-stompin-at-the-savoy'
            ]
        },
        {
            id: 'dexter-gordon',
            name: 'Dexter Gordon',
            instrument: 'saxophone',
            songs: [ 'dexter-gordon-cheese-cake', 'dexter-gordon-dextivity' ]
        },
        {
            id: 'dizzy-gillespie',
            name: 'Dizzy Gillespie',
            instrument: 'trumpet',
            songs: [
                'gillespie-night-in-tunisia',
                'dizzy-gillespie-anthropology',
                'dizzy-gillespie-be-bop',
                'dizzy-gillespie-groovin-high',
                'dizzy-gillespie-hot-house'
            ]
        },
        {
            id: 'eric-dolphy',
            name: 'Eric Dolphy',
            instrument: 'saxophone',
            songs: [ 'eric-dolphy-on-green-dolphin-street' ]
        },
        {
            id: 'fats-navarro',
            name: 'Fats Navarro',
            instrument: 'trumpet',
            songs: [
                'fats-navarro-anthropology',
                'fats-navarro-good-bait',
                'fats-navarro-our-delight'
            ]
        },
        {
            id: 'freddie-hubbard',
            name: 'Freddie Hubbard',
            instrument: 'trumpet',
            songs: [
                'freddie-hubbard-dolphin-dance',
                'freddie-hubbard-maiden-voyage'
            ]
        },
        {
            id: 'hank-mobley',
            name: 'Hank Mobley',
            instrument: 'saxophone',
            songs: [
                'hank-mobley-lady-bird',
                'hank-mobley-remember',
                'hank-mobley-soul-station'
            ]
        },
        {
            id: 'herbie-hancock',
            name: 'Herbie Hancock',
            instrument: 'piano',
            songs: [ 'hancock-maiden-voyage' ]
        },
        {
            id: 'j-j-johnson',
            name: 'J.J. Johnson',
            instrument: 'trombone',
            songs: [
                'j-j-johnson-blues-in-the-closet',
                'j-j-johnson-crazy-rhythm',
                'j-j-johnson-my-funny-valentine',
                'j-j-johnson-walkin',
                'j-j-johnson-yesterdays'
            ]
        },
        {
            id: 'john-coltrane',
            name: 'John Coltrane',
            instrument: 'saxophone',
            songs: [
                'coltrane-giant-steps',
                'john-coltrane-26-2',
                'john-coltrane-bessies-blues',
                'john-coltrane-blues-by-five',
                'john-coltrane-blue-train',
                'john-coltrane-countdown',
                'john-coltrane-giant-steps',
                'john-coltrane-mr-p-c'
            ]
        },
        {
            id: 'miles-davis',
            name: 'Miles Davis',
            instrument: 'trumpet',
            songs: [
                'miles-davis-so-what',
                'miles-davis-all-blues',
                'miles-davis-freddie-freeloader',
                'miles-davis-blue-in-green',
                'miles-davis-round-midnight',
                'miles-davis-someday-my-prince',
                'miles-davis-milestones',
                'miles-davis-seven-steps-to-heaven',
                'miles-davis-solar',
                'miles-davis-nardis'
            ]
        },
        {
            id: 'oscar-peterson',
            name: 'Oscar Peterson',
            instrument: 'piano',
            songs: [
                'oscar-peterson-alice-in-wonderland',
                'oscar-peterson-all-of-me',
                'oscar-peterson-bags-groove',
                'oscar-peterson-blues-etude',
                'oscar-peterson-cheek-to-cheek1',
                'oscar-peterson-falling-in-love-with-love',
                'oscar-peterson-im-old-fashioned',
                'oscar-peterson-its-allright-with-me',
                'oscar-peterson-its-de-lovely',
                'oscar-peterson-tangerine',
                'oscar-peterson-on-green-dolphin-street',
                'oscar-peterson-softly-as-in-a-morning-sunrise',
                'oscar-peterson-sometimes-im-happy',
                'oscar-peterson-the-song-is-you',
                'oscar-peterson-that-old-black-magic',
                'oscar-peterson-waltz-for-debby',
                'oscar-peterson-whisper-not',
                'oscar-peterson-you-stepped-out-of-a-dream',
                'oscar-peterson-yours-is-my-heart-alone',
                'oscar-peterson-younger-than-springtime'
            ]
        },
        {
            id: 'red-garland',
            name: 'Red Garland',
            instrument: 'piano',
            songs: [
                'red-garland-a-foggy-day',
                'red-garland-youd-be-so-nice-to-come-home-to',
                'red-garland-blues-in-the-closet'
            ]
        },
        {
            id: 'sonny-rollins',
            name: 'Sonny Rollins',
            instrument: 'saxophone',
            songs: [ 'rollins-st-thomas' ]
        },
        {
            id: 'thelonious-monk',
            name: 'Thelonious Monk',
            instrument: 'piano',
            songs: [ 'monk-round-midnight' ]
        },
        {
            id: 'wes-montgomery',
            name: 'Wes Montgomery',
            instrument: 'guitar',
            songs: [ 'montgomery-four-on-six' ]
        }
    ],
    songs: {
        'charlie-parker-an-oscar-for-treadwell-1': {
            id: 'charlie-parker-an-oscar-for-treadwell-1',
            title: 'An Oscar for Treadwell',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'Azbb6_HDjSk',
            playbackRange: { start: 33.379, end: 84.229 },
            notesPath: 'data/notes/charlie-parker-an-oscar-for-treadwell.json'
        },
        'charlie-parker-another-hair-do-1': {
            id: 'charlie-parker-another-hair-do-1',
            title: 'Another Hair Do',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'K5KFhR2kcEU',
            playbackRange: { start: 25.206, end: 91.715 },
            notesPath: 'data/notes/charlie-parker-another-hair-do.json'
        },
        'charlie-parker-anthropology-1': {
            id: 'charlie-parker-anthropology-1',
            title: 'Anthropology',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'iRJaY6wfOag',
            playbackRange: { start: 20.228, end: 92.492 },
            notesPath: 'data/notes/charlie-parker-anthropology.json'
        },
        'charlie-parker-au-privave-2': {
            id: 'charlie-parker-au-privave-2',
            title: 'Au Privave',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 2,
            youtubeId: 'ptdukBLV3j4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-au-privave-2.json'
        },
        'charlie-parker-au-privave-3': {
            id: 'charlie-parker-au-privave-3',
            title: 'Au Privave',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 3,
            youtubeId: '0geT6FWeX8w',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-au-privave-3.json'
        },
        'charlie-parker-back-home-blues': {
            id: 'charlie-parker-back-home-blues',
            title: 'Back Home Blues',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'OoueZPKIywk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-back-home-blues.json'
        },
        'charlie-parker-barbados': {
            id: 'charlie-parker-barbados',
            title: 'Barbados',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'aIRVoZ2esDg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-barbados.json'
        },
        'charlie-parker-billies-bounce': {
            id: 'charlie-parker-billies-bounce',
            title: 'Billie\'s Bounce',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'gVVffSREjd4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-billie\'s-bounce.json'
        },
        'charlie-parker-bird-gets-the-worm': {
            id: 'charlie-parker-bird-gets-the-worm',
            title: 'Bird Gets the Worm',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'gY5iZ6UwB5E',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-bird-gets-the-worm.json'
        },
        'charlie-parker-bloomdido': {
            id: 'charlie-parker-bloomdido',
            title: 'Bloomdido',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'wAGFm8uUtY8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-bloomdido.json'
        },
        'charlie-parker-blue-bird': {
            id: 'charlie-parker-blue-bird',
            title: 'Blue Bird',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '3UcSvB1cOTk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-blue-bird.json'
        },
        'charlie-parker-blues-for-alice': {
            id: 'charlie-parker-blues-for-alice',
            title: 'Blues For Alice',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '3UcSvB1cOTk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-blues-for-alice.json'
        },
        'charlie-parker-buzzy': {
            id: 'charlie-parker-buzzy',
            title: 'Buzzy',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'MKk60eb1s_8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-buzzy.json'
        },
        'charlie-parker-card-board': {
            id: 'charlie-parker-card-board',
            title: 'Card Board',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'CrLHwJiLofA',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-card-board.json'
        },
        'charlie-parker-celerity': {
            id: 'charlie-parker-celerity',
            title: 'Celerity',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'Fm6M1a2eq_w',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-celerity.json'
        },
        'charlie-parker-chasing-the-bird': {
            id: 'charlie-parker-chasing-the-bird',
            title: 'Chasing The Bird',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'SDIjBVUNogk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-chasing-the-bird.json'
        },
        'charlie-parker-cheryl': {
            id: 'charlie-parker-cheryl',
            title: 'Cheryl',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '0Y24uhL0nbo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-cheryl.json'
        },
        'charlie-parker-chi-chi': {
            id: 'charlie-parker-chi-chi',
            title: 'Chi Chi',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'lOpCYfhCMTs',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-chi-chi.json'
        },
        'charlie-parker-confirmation': {
            id: 'charlie-parker-confirmation',
            title: 'Confirmation',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'qHFSoE-3t-o',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-confirmation.json'
        },
        'charlie-parker-cosmic-rays': {
            id: 'charlie-parker-cosmic-rays',
            title: 'Cosmic Rays',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'O3Lf0dlsUKc',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-cosmic-rays.json'
        },
        'charlie-parker-dewey-square': {
            id: 'charlie-parker-dewey-square',
            title: 'Dewey Square',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'eLey06n6WKw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-dewey-square.json'
        },
        'charlie-parker-diverse': {
            id: 'charlie-parker-diverse',
            title: 'Diverse',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '-oKR460Px-E',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-diverse.json'
        },
        'charlie-parker-donna-lee': {
            id: 'charlie-parker-donna-lee',
            title: 'Donna Lee',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'Z715pVwyBkg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-donna-lee.json'
        },
        'charlie-parker-kc-blues': {
            id: 'charlie-parker-kc-blues',
            title: 'KC Blues',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'N8-JqYgD4l8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-kc-blues.json'
        },
        'charlie-parker-kim-1': {
            id: 'charlie-parker-kim-1',
            title: 'Kim',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'kne-FoHw7Nk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-kim-1.json'
        },
        'charlie-parker-kim-2': {
            id: 'charlie-parker-kim-2',
            title: 'Kim',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 2,
            youtubeId: 'HL1Yg5ZLMnk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-kim-2.json'
        },
        'charlie-parker-ko-ko': {
            id: 'charlie-parker-ko-ko',
            title: 'Ko Ko',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '0ajJBNodEYs',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-ko-ko.json'
        },
        'charlie-parker-laird-baird': {
            id: 'charlie-parker-laird-baird',
            title: 'Laird Baird',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'FUL6MX07Cu8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-laird-baird.json'
        },
        'charlie-parker-marmaduke': {
            id: 'charlie-parker-marmaduke',
            title: 'Marmaduke',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'CArjo1dOErI',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-marmaduke.json'
        },
        'charlie-parker-mohawk-1': {
            id: 'charlie-parker-mohawk-1',
            title: 'Mohawk',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'nN8o9AQPAyk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-mohawk-1.json'
        },
        'charlie-parker-mohawk-2': {
            id: 'charlie-parker-mohawk-2',
            title: 'Mohawk',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 2,
            youtubeId: 'mZH3YsFODjg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-mohawk-2.json'
        },
        'charlie-parker-moose-the-mooche': {
            id: 'charlie-parker-moose-the-mooche',
            title: 'Moose The Mooche',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'HOoZ6zo8HAQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-moose-the-mooche.json'
        },
        'charlie-parker-my-little-suede-shoes': {
            id: 'charlie-parker-my-little-suede-shoes',
            title: 'My Little Suede Shoes',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '2TghfhihKd8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-my-little-suede-shoes.json'
        },
        'charlie-parker-nows-the-time-1': {
            id: 'charlie-parker-nows-the-time-1',
            title: 'Now\'s The Time',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 1,
            youtubeId: 'RP29Qn00_Nw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-now\'s-the-time-1.json'
        },
        'charlie-parker-nows-the-time-2': {
            id: 'charlie-parker-nows-the-time-2',
            title: 'Now\'s The Time',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: 2,
            youtubeId: '9dslss6qCC0',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-now\'s-the-time-2.json'
        },
        'charlie-parker-ornithology': {
            id: 'charlie-parker-ornithology',
            title: 'Ornithology',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'OKQcgu8dbuw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-ornithology.json'
        },
        'charlie-parker-passport': {
            id: 'charlie-parker-passport',
            title: 'Passport',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'PqZ4NATmImM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-passport.json'
        },
        'charlie-parker-perhaps': {
            id: 'charlie-parker-perhaps',
            title: 'Perhaps',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'EIoc8UBG4dk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-perhaps.json'
        },
        'charlie-parker-red-cross': {
            id: 'charlie-parker-red-cross',
            title: 'Red Cross',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '7eG1oh1_g84',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-red-cross.json'
        },
        'charlie-parker-relaxing-with-lee': {
            id: 'charlie-parker-relaxing-with-lee',
            title: 'Relaxing With Lee',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'pMSHYZy7jP4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-relaxing-with-lee.json'
        },
        'charlie-parker-scrapple-from-the-apple': {
            id: 'charlie-parker-scrapple-from-the-apple',
            title: 'Scrapple From The Apple',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'HSeiIvBdAis',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-scrapple-from-the-apple.json'
        },
        'charlie-parker-segment': {
            id: 'charlie-parker-segment',
            title: 'Segment',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: '_KsLNGcuTlE',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-segment.json'
        },
        'charlie-parker-shaw-nuff': {
            id: 'charlie-parker-shaw-nuff',
            title: 'Shaw nuff',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'TzJ57OZOelI',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-shaw-nuff.json'
        },
        'charlie-parker-si-si': {
            id: 'charlie-parker-si-si',
            title: 'Si Si',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'S1GtwuLHj1w',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-si-si.json'
        },
        'charlie-parker-steeplechase': {
            id: 'charlie-parker-steeplechase',
            title: 'Steeplechase',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'r7DpoaWNyKo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-steeplechase.json'
        },
        'charlie-parker-the-bird': {
            id: 'charlie-parker-the-bird',
            title: 'The Bird',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'tn7icCmecEw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-the-bird.json'
        },
        'charlie-parker-thriving-from-a-riff': {
            id: 'charlie-parker-thriving-from-a-riff',
            title: 'Thriving From A Riff',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'aZOvggm3TQQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-thriving-from-a-riff.json'
        },
        'charlie-parker-visa': {
            id: 'charlie-parker-visa',
            title: 'Visa',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'YxwXUJHEQk4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-visa.json'
        },
        'charlie-parker-warming-up-a-riff': {
            id: 'charlie-parker-warming-up-a-riff',
            title: 'Warming Up A Riff',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'g3tETxZY7Vo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-warming-up-a-riff.json'
        },
        'charlie-parker-yardbird-suite': {
            id: 'charlie-parker-yardbird-suite',
            title: 'Yardbird Suite',
            artist: 'Charlie Parker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'K5sMapsiqyM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/charlie-parker-yardbird-suite.json'
        },
        'chet-baker-i-fall-in-love-too-easily': {
            id: 'chet-baker-i-fall-in-love-too-easily',
            title: 'I Fall in Love Too Easily',
            artist: 'Chet Baker',
            album: null,
            year: null,
            take: null,
            youtubeId: '_ZRJrAHprBM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/chet-baker-i-fall-in-love-too-easily.json'
        },
        'chet-baker-just-friends': {
            id: 'chet-baker-just-friends',
            title: 'Just Friends',
            artist: 'Chet Baker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'mWQc_1b3sNg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/chet-baker-just-friends.json'
        },
        'chet-baker-lets-get-lost': {
            id: 'chet-baker-lets-get-lost',
            title: 'Let\'s Get Lost',
            artist: 'Chet Baker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'aVmbh93-a24',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/chet-baker-let\'s-get-lost.json'
        },
        'chet-baker-long-ago-and-far-away': {
            id: 'chet-baker-long-ago-and-far-away',
            title: 'Long Ago and Far Away',
            artist: 'Chet Baker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'QI37tzFJYqA',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/chet-baker-long-ago-and-far-away.json'
        },
        'chet-baker-there-will-never-be-another-you': {
            id: 'chet-baker-there-will-never-be-another-you',
            title: 'There Will Never Be Another You',
            artist: 'Chet Baker',
            album: null,
            year: null,
            take: null,
            youtubeId: 'rMX1LxBba9g',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/chet-baker-there-will-never-be-another-you.json'
        },
        'clifford-brown-a-night-in-tunisia': {
            id: 'clifford-brown-a-night-in-tunisia',
            title: 'A Night in Tunisia',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'uszBkQIrjqo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-a-night-in-tunisia.json'
        },
        'clifford-brown-daahoud': {
            id: 'clifford-brown-daahoud',
            title: 'Daahoud',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'T5YLzdzkiTM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-daahoud.json'
        },
        'clifford-brown-ill-remember-april': {
            id: 'clifford-brown-ill-remember-april',
            title: 'I\'ll Remember April',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'J_KCboXhofo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-l\'ll-remember-april.json'
        },
        'clifford-brown-jordu': {
            id: 'clifford-brown-jordu',
            title: 'Jordu',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'F3AZPwTTnrk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-jordu.json'
        },
        'clifford-brown-joy-spring': {
            id: 'clifford-brown-joy-spring',
            title: 'Joy Spring',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'FE1t6lUVB_k',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-joy-spring.json'
        },
        'clifford-brown-sandu': {
            id: 'clifford-brown-sandu',
            title: 'Sandu',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: '0wpcrWCutFQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-sandu.json'
        },
        'clifford-brown-stompin-at-the-savoy': {
            id: 'clifford-brown-stompin-at-the-savoy',
            title: 'Stompin\' at the Savoy',
            artist: 'Clifford Brown',
            album: null,
            year: null,
            take: null,
            youtubeId: 'DikaQlSJrwg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/clifford-brown-stompin\'-at-the-savoy.json'
        },
        'dexter-gordon-cheese-cake': {
            id: 'dexter-gordon-cheese-cake',
            title: 'Cheese Cake',
            artist: 'Dexter Gordon',
            album: null,
            year: null,
            take: null,
            youtubeId: 'a9HP9p3GXg8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dexter-gordon-cheese-cake.json'
        },
        'dexter-gordon-dextivity': {
            id: 'dexter-gordon-dextivity',
            title: 'Dextivity',
            artist: 'Dexter Gordon',
            album: null,
            year: null,
            take: null,
            youtubeId: 'SRO2ICUfqH4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dexter-gordon-dextivity.json'
        },
        'dizzy-gillespie-anthropology': {
            id: 'dizzy-gillespie-anthropology',
            title: 'Anthropology',
            artist: 'Dizzy Gillespie',
            album: null,
            year: null,
            take: null,
            youtubeId: 'So1aGLcTwTw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dizzy-gillespie-anthropology.json'
        },
        'dizzy-gillespie-be-bop': {
            id: 'dizzy-gillespie-be-bop',
            title: 'Be-Bop',
            artist: 'Dizzy Gillespie',
            album: null,
            year: null,
            take: null,
            youtubeId: '3wSUxEnQha8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dizzy-gillespie-be-bop.json'
        },
        'dizzy-gillespie-groovin-high': {
            id: 'dizzy-gillespie-groovin-high',
            title: 'Groovin\' High',
            artist: 'Dizzy Gillespie',
            album: null,
            year: null,
            take: null,
            youtubeId: 'qmnrpchIKJI',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dizzy-gillespie-groovin窶・high.json'
        },
        'dizzy-gillespie-hot-house': {
            id: 'dizzy-gillespie-hot-house',
            title: 'Hot House',
            artist: 'Dizzy Gillespie',
            album: null,
            year: null,
            take: null,
            youtubeId: '0PDjh9zgULM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/dizzy-gillespie-hot-house.json'
        },
        'eric-dolphy-on-green-dolphin-street': {
            id: 'eric-dolphy-on-green-dolphin-street',
            title: 'On Green Dolphin Street',
            artist: 'Eric Dolphy',
            album: null,
            year: null,
            take: null,
            youtubeId: '5FfOJwflCkU',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/eric-dolphy-on-green-dolphin-street.json'
        },
        'fats-navarro-anthropology': {
            id: 'fats-navarro-anthropology',
            title: 'Anthropology',
            artist: 'Fats Navarro',
            album: null,
            year: null,
            take: null,
            youtubeId: 'ipCNtYQB45g',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/fats-navarro-anthropology.json'
        },
        'fats-navarro-good-bait': {
            id: 'fats-navarro-good-bait',
            title: 'Good Bait',
            artist: 'Fats Navarro',
            album: null,
            year: null,
            take: null,
            youtubeId: 'yq5YayKMR28',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/fats-navarro-good-bait.json'
        },
        'fats-navarro-our-delight': {
            id: 'fats-navarro-our-delight',
            title: 'Our Delight',
            artist: 'Fats Navarro',
            album: null,
            year: null,
            take: null,
            youtubeId: 'yAJfeUKcd3I',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/fats-navarro-our-delight.json'
        },
        'freddie-hubbard-dolphin-dance': {
            id: 'freddie-hubbard-dolphin-dance',
            title: 'Dolphin Dance',
            artist: 'Freddie Hubbard',
            album: null,
            year: null,
            take: null,
            youtubeId: 'RaHCnfI7y74',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/freddie-hubbard-dolphin-dance.json'
        },
        'freddie-hubbard-maiden-voyage': {
            id: 'freddie-hubbard-maiden-voyage',
            title: 'Maiden Voyage',
            artist: 'Freddie Hubbard',
            album: null,
            year: null,
            take: null,
            youtubeId: 'hwmRQ0PBtXU',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/freddie-hubbard-maiden-voyage.json'
        },
        'hank-mobley-lady-bird': {
            id: 'hank-mobley-lady-bird',
            title: 'Lady Bird',
            artist: 'Hank Mobley',
            album: null,
            year: null,
            take: null,
            youtubeId: 'tSXe8FKoJA0',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/hank-mobley-lady-bird.json'
        },
        'hank-mobley-remember': {
            id: 'hank-mobley-remember',
            title: 'Remember',
            artist: 'Hank Mobley',
            album: null,
            year: null,
            take: null,
            youtubeId: 'KV0HX9sk_04',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/hank-mobley-remember.json'
        },
        'hank-mobley-soul-station': {
            id: 'hank-mobley-soul-station',
            title: 'Soul Station',
            artist: 'Hank Mobley',
            album: null,
            year: null,
            take: null,
            youtubeId: 'UfUIzb4IFgA',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/hank-mobley-soul-station.json'
        },
        'j-j-johnson-blues-in-the-closet': {
            id: 'j-j-johnson-blues-in-the-closet',
            title: 'Blues in the Closet',
            artist: 'J.J. Johnson',
            album: null,
            year: null,
            take: null,
            youtubeId: '4F7OpwESvbI',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/j.j.-johnson-blues-in-the-closet.json'
        },
        'j-j-johnson-crazy-rhythm': {
            id: 'j-j-johnson-crazy-rhythm',
            title: 'Crazy Rhythm',
            artist: 'J.J. Johnson',
            album: null,
            year: null,
            take: null,
            youtubeId: '4nwaucW9Ha4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/j.j.-johnson-crazy-rhythm.json'
        },
        'j-j-johnson-my-funny-valentine': {
            id: 'j-j-johnson-my-funny-valentine',
            title: 'My Funny Valentine',
            artist: 'J.J. Johnson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'uj9QdJzbC7k',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/j.j.-johnson-my-funny-valentine.json'
        },
        'j-j-johnson-walkin': {
            id: 'j-j-johnson-walkin',
            title: 'Walkin\'',
            artist: 'J.J. Johnson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'JsLssoPYDkM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/j.j.-johnson-walkin\'.json'
        },
        'j-j-johnson-yesterdays': {
            id: 'j-j-johnson-yesterdays',
            title: 'Yesterdays',
            artist: 'J.J. Johnson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'F_73bcGGleA',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/j.j.-johnson-yesterdays.json'
        },
        'john-coltrane-26-2': {
            id: 'john-coltrane-26-2',
            title: '26-2',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'YRpSFx23sKQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-26-2.json'
        },
        'john-coltrane-bessies-blues': {
            id: 'john-coltrane-bessies-blues',
            title: 'Bessie\'s Blues',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'XMC2bvHk0Bo',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-bessie\'s-blues.json'
        },
        'john-coltrane-blues-by-five': {
            id: 'john-coltrane-blues-by-five',
            title: 'Blues by Five',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'EaBAfHs4Qc8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-blues-by-five.json'
        },
        'john-coltrane-blue-train': {
            id: 'john-coltrane-blue-train',
            title: 'Blue Train',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'HT_Zs5FKDZE',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-blue-train.json'
        },
        'john-coltrane-countdown': {
            id: 'john-coltrane-countdown',
            title: 'Countdown',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'HKRbZSxkmJM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-countdown.json'
        },
        'john-coltrane-giant-steps': {
            id: 'john-coltrane-giant-steps',
            title: 'Giant Steps',
            artist: 'John Coltrane',
            album: 'Giant Steps',
            year: 1960,
            take: null,
            youtubeId: 'KwIC6B_dvW4',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-giant-steps.json'
        },
        'john-coltrane-mr-p-c': {
            id: 'john-coltrane-mr-p-c',
            title: 'Mr. P.C.',
            artist: 'John Coltrane',
            album: null,
            year: null,
            take: null,
            youtubeId: 'Jv5j_Lx2R4g',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/john-coltrane-mr.-p.c..json'
        },
        'oscar-peterson-alice-in-wonderland': {
            id: 'oscar-peterson-alice-in-wonderland',
            title: 'Alice in Wonderland',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'PrEcT2Q51lw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-alice-in-wonderland.json'
        },
        'oscar-peterson-all-of-me': {
            id: 'oscar-peterson-all-of-me',
            title: 'all of me',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: '96jO3y8TVn8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-all-of-me.json'
        },
        'oscar-peterson-bags-groove': {
            id: 'oscar-peterson-bags-groove',
            title: 'Bag\'s Groove',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'Vsdtve9LKFE',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-bag\'s-groove.json'
        },
        'oscar-peterson-blues-etude': {
            id: 'oscar-peterson-blues-etude',
            title: 'Blues Etude',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'yTsvAvLZetw',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-blues-etude.json'
        },
        'oscar-peterson-cheek-to-cheek1': {
            id: 'oscar-peterson-cheek-to-cheek1',
            title: 'Cheek to Cheek',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: 1,
            youtubeId: '5ohfwPqeiAQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-cheek-to-cheek1.json'
        },
        'oscar-peterson-falling-in-love-with-love': {
            id: 'oscar-peterson-falling-in-love-with-love',
            title: 'Falling in love with love',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'JrlsXEQ5RCY',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-falling-in-love-with-love.json'
        },
        'oscar-peterson-im-old-fashioned': {
            id: 'oscar-peterson-im-old-fashioned',
            title: 'I\'m Old Fashioned',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'KijiI-FUDkU',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-i\'m-old-fashioned.json'
        },
        'oscar-peterson-its-allright-with-me': {
            id: 'oscar-peterson-its-allright-with-me',
            title: 'it\'s Allright with me',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'jXzFVVYsm9AQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-it\'s-allright-with-me.json'
        },
        'oscar-peterson-its-de-lovely': {
            id: 'oscar-peterson-its-de-lovely',
            title: 'It\'s De-Lovely',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'b59zpvvliTg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-it\'s-de-lovely.json'
        },
        'oscar-peterson-tangerine': {
            id: 'oscar-peterson-tangerine',
            title: 'Tangerine',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'ns4rTpr6D-g',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-tangerine.json'
        },
        'oscar-peterson-on-green-dolphin-street': {
            id: 'oscar-peterson-on-green-dolphin-street',
            title: 'On Green Dolphin Street',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'Qc46jDwA30U',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-on-green-dolphin-street.json'
        },
        'oscar-peterson-softly-as-in-a-morning-sunrise': {
            id: 'oscar-peterson-softly-as-in-a-morning-sunrise',
            title: 'Softly As In A Morning Sunrise',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'TH1crkVVNbM',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-softly-as-in-a-morning-sunrise.json'
        },
        'oscar-peterson-sometimes-im-happy': {
            id: 'oscar-peterson-sometimes-im-happy',
            title: 'Sometimes I\'m Happy',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'QUj139N6-mc',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-sometimes-i\'m-happy.json'
        },
        'oscar-peterson-the-song-is-you': {
            id: 'oscar-peterson-the-song-is-you',
            title: 'The Song Is You',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: '8ty104Tvibk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-the-song-is-you.json'
        },
        'oscar-peterson-that-old-black-magic': {
            id: 'oscar-peterson-that-old-black-magic',
            title: 'That Old Black Magic',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'ZIyp3accaTA',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-that-old-black-magic.json'
        },
        'oscar-peterson-waltz-for-debby': {
            id: 'oscar-peterson-waltz-for-debby',
            title: 'Waltz For Debby',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'u93YOlMTjnk',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-waltz-for-debby.json'
        },
        'oscar-peterson-whisper-not': {
            id: 'oscar-peterson-whisper-not',
            title: 'Whisper Not',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'cfxc7emk0Us',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-whisper-not.json'
        },
        'oscar-peterson-you-stepped-out-of-a-dream': {
            id: 'oscar-peterson-you-stepped-out-of-a-dream',
            title: 'You Stepped Out of a Dream',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'AVvUKPFISZQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-you-stepped-out-of-a-dream.json'
        },
        'oscar-peterson-yours-is-my-heart-alone': {
            id: 'oscar-peterson-yours-is-my-heart-alone',
            title: 'Yours Is My Heart Alone',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: 'vMXsUEKkjQ8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-yours-is-my-heart-alone.json'
        },
        'oscar-peterson-younger-than-springtime': {
            id: 'oscar-peterson-younger-than-springtime',
            title: 'Younger Than Springtime',
            artist: 'Oscar Peterson',
            album: null,
            year: null,
            take: null,
            youtubeId: '4II0yXh-pRg',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/oscar-peterson-younger-than-springtime.json'
        },
        'bill-evans-alice-in-wonderland': {
            id: 'bill-evans-alice-in-wonderland',
            title: 'Alice in Wonderland',
            artist: 'Bill Evans',
            album: null,
            year: null,
            take: null,
            youtubeId: 'XquY0vcm-tQ',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/bill-evans-alice-in-wonderland.json'
        },
        'bill-evans-autumn-leaves': {
            id: 'bill-evans-autumn-leaves',
            title: 'Autumn Leaves',
            artist: 'Bill Evans',
            album: null,
            year: null,
            take: null,
            youtubeId: 'OlDV1Ck8P4E',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/bill-evans-autumn-leaves.json'
        },
        'red-garland-a-foggy-day': {
            id: 'red-garland-a-foggy-day',
            title: 'a foggy day',
            artist: 'Red Garland',
            album: null,
            year: null,
            take: null,
            youtubeId: 'KOS4mZvgscs',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/red-garland-a-foggy-day.json'
        },
        'red-garland-youd-be-so-nice-to-come-home-to': {
            id: 'red-garland-youd-be-so-nice-to-come-home-to',
            title: 'You\'d Be So Nice to Come Home To',
            artist: 'Red Garland',
            album: null,
            year: null,
            take: null,
            youtubeId: 'FcG6ZHaH5RY',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/red-garland-you\'d-be-so-nice-to-come-home-to.json'
        },
        'red-garland-blues-in-the-closet': {
            id: 'red-garland-blues-in-the-closet',
            title: 'Blues In The Closet',
            artist: 'Red Garland',
            album: null,
            year: null,
            take: null,
            youtubeId: 'RUU6jVwdPB8',
            playbackRange: { start: 0, end: 180 },
            notesPath: 'data/notes/red-garland-blues-in-the-closet.json'
        }
    },
    instruments: [
        {
            id: 'bass',
            name: 'Bass',
            artists: [ 'charles-mingus' ]
        },
        {
            id: 'drums',
            name: 'Drums',
            artists: [ 'art-blakey' ]
        },
        {
            id: 'guitar',
            name: 'Guitar',
            artists: [ 'wes-montgomery' ]
        },
        {
            id: 'piano',
            name: 'Piano',
            artists: [ 'bill-evans', 'herbie-hancock', 'oscar-peterson', 'red-garland', 'thelonious-monk' ]
        },
        {
            id: 'saxophone',
            name: 'Saxophone',
            artists: [
                'cannonball-adderley',
                'charlie-parker',
                'dexter-gordon',
                'eric-dolphy',
                'hank-mobley',
                'john-coltrane',
                'sonny-rollins'
            ]
        },
        {
            id: 'trombone',
            name: 'Trombone',
            artists: [ 'j-j-johnson' ]
        },
        {
            id: 'trumpet',
            name: 'Trumpet',
            artists: [
                'chet-baker',
                'clifford-brown',
                'dizzy-gillespie',
                'fats-navarro',
                'freddie-hubbard',
                'miles-davis'
            ]
        }
    ]
};

// Dynamic playbackRange initialization using browser fetch
if (typeof fetch === 'function') {
    // フィルタリング完了フラグの初期化
    window.gameDataFiltered = false;

    // ★ playbackRange の取得と存在チェックは下の IIFE でまとめて行うため、このループを削除しました
    // Object.values(gameData.songs).forEach(song => {
    //     if (song.notesPath) {
    //         fetch(`/${song.notesPath}`)
    //             .then(res => res.ok ? res.json() : Promise.reject())
    //             .then(notes => {
    //                 if (!Array.isArray(notes) || notes.length === 0) return;
    //                 const times = notes.map(n => n.time);
    //                 const minTime = Math.min(...times);
    //                 const maxTime = Math.max(...times);
    //                 song.playbackRange = {
    //                     start: Math.max(minTime - 10, 0),
    //                     end: maxTime + 5
    //                 };
    //             })
    //             .catch(() => {});
    //     }
    // });

    // ここから追加: 存在しないJSONファイルがある場合の曲・アーティスト・楽器の削除
    (async () => {
        // notesPath が存在し JSON が取得できた曲のみを保持しつつ playbackRange を設定
        const existingIdList = await Promise.all(
            Object.entries(gameData.songs).map(async ([id, song]) => {
                // notesPath が無い曲はそのまま保持
                if (!song.notesPath) return id;
                try {
                    const res = await fetch(`/${song.notesPath}`);
                    if (!res.ok) throw new Error();

                    const notes = await res.json();
                    if (Array.isArray(notes) && notes.length > 0) {
                        const times = notes.map(n => n.time);
                        song.playbackRange = {
                            start: Math.max(Math.min(...times) - 10, 0),
                            end: Math.max(...times) + 5
                        };
                    }
                    return id; // JSON が読めたので保持
                } catch {
                    // 読み込み失敗 -> 除外
                    return null;
                }
            })
        );
        const existingIds = new Set(existingIdList.filter(Boolean));

        // Songsのフィルタ
        Object.keys(gameData.songs).forEach(id => {
            if (!existingIds.has(id)) delete gameData.songs[id];
        });
        // Artistsのフィルタ
        gameData.artists = gameData.artists.filter(artist => {
            artist.songs = artist.songs.filter(id => existingIds.has(id));
            return artist.songs.length > 0;
        });
        // Instrumentsのフィルタ
        gameData.instruments = gameData.instruments.filter(inst => {
            inst.artists = inst.artists.filter(artistId =>
                gameData.artists.some(a => a.id === artistId)
            );
            return inst.artists.length > 0;
        });

        // ★ フィルタリング完了フラグとイベントを設定 ★
        window.gameDataFiltered = true;
        document.dispatchEvent(new Event('gameDataFiltered'));
    })();
}

// 検索用の簡易インデックス (アルバム情報なども含めて検索できるようにする場合)
const searchIndex = (() => {
    const index = [];
    for (const songId in gameData.songs) {
        const song = gameData.songs[songId];
        const title = song.title || ''; // null の場合に空文字を設定
        const artist = song.artist || ''; // null の場合に空文字を設定
        const album = song.album || '';   // null の場合に空文字を設定
        const year = song.year || '';     // null の場合に空文字を設定

        index.push({
            id: songId,
            searchText: `${title.toLowerCase()} ${artist.toLowerCase()} ${album.toLowerCase()} ${year}`
        });
    }
    return index;
})();

// DataManager: アプリが利用するデータ取得系メソッド
const DataManager = {
    // アーティストリストを返す
    getArtists() {
        return gameData.artists;
    },

    // 特定のアーティストの曲データをまとめて返す
    getSongsByArtist(artistId) {
        const artist = gameData.artists.find(a => a.id === artistId);
        if (!artist) return [];
        return artist.songs.map(songId => gameData.songs[songId]);
    },

    // 特定の曲データを返す
    getSong(songId) {
        return gameData.songs[songId] || null;
    },

    // 曲タイトルやアーティストなどから検索する
    searchSongs(searchTerm) {
        // 検索語句を空白で分割し、小文字化して空の要素を除去
        const searchTerms = searchTerm.toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 0);
        
        if (searchTerms.length === 0) return [];
        
        // 検索結果とスコアを計算
        const results = Object.values(gameData.songs)
            .map(song => {
                // 検索対象のテキストを準備
                const artistText = song.artist.toLowerCase();
                const titleText = song.title.toLowerCase();
                const albumText = (song.album || '').toLowerCase();
                const yearText = String(song.year);
                
                // 初期スコアを設定
                let score = 0;
                let allTermsFound = true;
                
                // 各検索語句についてスコアを計算
                for (const term of searchTerms) {
                    let termFound = false;
                    
                    // アーティスト名での完全一致（最も高いスコア）
                    if (artistText === term) {
                        score += 100;
                        termFound = true;
                    }
                    // アーティスト名に含まれる
                    else if (artistText.includes(term)) {
                        score += 50;
                        termFound = true;
                    }
                    
                    // 曲名での完全一致
                    if (titleText === term) {
                        score += 80;
                        termFound = true;
                    }
                    // 曲名に含まれる
                    else if (titleText.includes(term)) {
                        score += 40;
                        termFound = true;
                    }
                    
                    // アルバム名での完全一致
                    if (albumText === term) {
                        score += 60;
                        termFound = true;
                    }
                    // アルバム名に含まれる
                    else if (albumText.includes(term)) {
                        score += 30;
                        termFound = true;
                    }
                    
                    // 年での一致
                    if (yearText === term) {
                        score += 40;
                        termFound = true;
                    }
                    
                    // いずれかの条件に一致しなかった場合
                    if (!termFound) {
                        allTermsFound = false;
                        break;
                    }
                }
                
                return {
                    song,
                    score: allTermsFound ? score : 0
                };
            })
            .filter(result => result.score > 0) // スコアが0より大きいものだけを残す
            .sort((a, b) => b.score - a.score); // スコアの高い順にソート
        
        // ソート済みの曲データのみを返す
        return results.map(result => result.song);
    },

    // 楽器カテゴリー一覧を取得
    getInstruments() {
        return gameData.instruments;
    },

    // 楽器カテゴリーごとのアーティストを取得
    getArtistsByInstrument(instrumentId) {
        return gameData.artists.filter(artist => artist.instrument === instrumentId);
    },

    // アーティスト検索メソッドを追加
    searchArtists(searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return gameData.artists.filter(artist => 
            artist.name.toLowerCase().includes(lowerTerm)
        );
    },

    // 全曲をアーティスト名→曲名のアルファベット順で取得するメソッドを修正
    getAllSongsSorted() {
        return Object.values(gameData.songs)
            .sort((a, b) => {
                // まずアーティスト名で比較
                const artistCompare = a.artist.localeCompare(b.artist);
                // アーティスト名が同じ場合は曲名で比較
                if (artistCompare === 0) {
                    return a.title.localeCompare(b.title);
                }
                return artistCompare;
            });
    },

    // 楽器カテゴリごとの曲を取得
    getSongsByInstrument(instrumentId) {
        const instrument = gameData.instruments.find(i => i.id === instrumentId);
        if (!instrument) return [];
        
        // その楽器のアーティストの曲をすべて取得
        const songs = instrument.artists.flatMap(artistId => {
            const artist = gameData.artists.find(a => a.id === artistId);
            return artist ? artist.songs.map(songId => gameData.songs[songId]) : [];
        });
        
        // アルファベット順にソート
        return songs.sort((a, b) => a.title.localeCompare(b.title));
    }
};

/**
 * 指定した曲の動画ID一覧を返す
 * (data.getSong で song.videoIds が設定されている前提)
 */
export function getVideoIdsBySong(songId) {
    const song = DataManager.getSong(songId);
    return song && song.videoIds ? song.videoIds : [];
}

/**
 * songId に対する有効な動画IDかチェック
 */
export function isValidVideoId(songId, id) {
    return getVideoIdsBySong(songId).includes(id);
}

export default DataManager;
