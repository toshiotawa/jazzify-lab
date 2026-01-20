import { FantasyRankInfo } from '@/utils/fantasyRankConstants';

type RankTranslation = Pick<FantasyRankInfo, 'title' | 'stageName' | 'description'>;

export const FANTASY_RANKS_BASIC_EN: Record<number, RankTranslation> = {
  1: { title: 'Budding Mana', stageName: 'Forest of Beginnings', description: 'A forest teeming with vitality at the foot of the World Tree. Here, you will feel the breath of Mana, the source of magic, for the first time.' },
  2: { title: 'Magic Apprentice', stageName: 'Apprentice Hill', description: 'A small hill overlooking the Magic Academy. Following the backs of great wizards, this is where you chant your first spell.' },
  3: { title: 'Yearning for Mystery', stageName: 'Lakeside of Stargazing', description: 'A quiet place where the stars of the night sky are reflected on the lake surface. Touching the mysteries of the world, a thirst for the unknown sprouts.' },
  4: { title: 'Wizard Egg', stageName: 'Sunny Village', description: 'A peaceful village with a gentle breeze. Learning the basics of magic and taking the first step, the land of all beginnings.' },
  5: { title: 'Mana Sensing', stageName: 'Whispering Cave', description: 'A cave where weak magical ores shine on the walls. Concentrate and train to feel the flow of Mana with your skin.' },
  6: { title: 'Apprentice Scribe', stageName: 'Library of Algiers', description: 'A small library lined with basic magic books. Touch fragments of ancient knowledge and learn the importance of theory.' },
  7: { title: 'Whisper of Stars', stageName: 'Temple of Silence', description: 'A small temple enshrining ancient gods. Listen to the faint guidance of the stars and catch a glimpse of destiny.' },
  8: { title: 'Spellcaster', stageName: 'Plains of Trial', description: 'A vast plain where you will try practical magic for the first time. Through battles with monsters, know the power of spells.' },
  9: { title: 'Mana Pool', stageName: 'Spring of Mist', description: 'A mystical spring where magic is condensed and rises as mist. A training ground to amplify the Mana within your body.' },
  10: { title: 'Researcher', stageName: 'Forgotten Ruins', description: 'Ruins where traces of magical civilization remain. Investigate ancient magic circles and relics to deepen your knowledge.' },
  // ... to be continued
};

export const FANTASY_RANKS_ADVANCED_EN: Record<number, RankTranslation> = {
  1: { title: 'Warrior\'s Intuition', stageName: 'Dusty Drill Ground', description: 'In the days of wielding a sword, you suddenly see the path of the future blade. Is it just intuition, or the awakening of an unknown power?' },
  2: { title: 'Oath of First Battle', stageName: 'Watchtower Fortress', description: 'Standing on the battlefield for the first time. The strong will to protect your comrades harbors a faint light in your body.' },
  3: { title: 'Roar of the Soul', stageName: 'Valley of War Cry', description: 'When cornered, the shout released from the bottom of your stomach exerts a mysterious power that frightens enemies and inspires allies.' },
  4: { title: 'Presence Detection', stageName: 'Crossroads of Beast Paths', description: 'In the silence of the forest, sharpen your five senses. Training to sense the flow of invisible "Qi" such as hostility and bloodlust.' },
  5: { title: 'Sprouting Fighting Spirit', stageName: 'Bridge of Duel', description: 'A duel with a nemesis. The internal heat created by extreme concentration makes swords and fists sharper.' },
  // ... to be continued
};

export const FANTASY_RANKS_PHRASES_EN: Record<number, RankTranslation> = {
  1: { title: 'Apprentice Summoner', stageName: 'Altar of Beginnings', description: 'Perform your first summoning ritual at an old stone altar. The faintly flickering flame implies a door to another world.' },
  2: { title: 'Guide of Contracts', stageName: 'Forest of Whispering Spirits', description: 'Particles of light drifting between trees announce the existence of spirits. The journey to find your first contract partner begins.' },
  3: { title: 'Spirit Sensor', stageName: 'Hill of Wind Spirits', description: 'Training to sense the presence of invisible spirits on a hill where a gentle wind always blows.' },
  4: { title: 'Friend of Small Spirits', stageName: 'Shrine of Babbling Stream', description: 'A shrine of a clear stream where small water spirits are said to live. Take the first step to communicate with them.' },
  5: { title: 'Ritual Chanter', stageName: 'Stone Monument of Ancient Language', description: 'An ancient stone monument engraved with summoning spells. Unravel the meaning of those words one by one.' },
  // ... to be continued
};

// Helper to generate generic English texts for missing translations
export function getGenericRankTranslation(rank: number, tier: 'basic' | 'advanced' | 'phrases'): RankTranslation {
  const tierName = tier === 'basic' ? 'Wizard' : tier === 'advanced' ? 'Warrior' : 'Summoner';
  return {
    title: `${tierName} Rank ${rank}`,
    stageName: `Stage ${rank}`,
    description: `Unlock this stage to prove your skills as a ${tierName}. Rank ${rank} challenge awaiting.`
  };
}
