export const TOUR = {
  start: 'p1',
  nodes: [
    {
      id: 'p1',
      name: 'VILLAGE SQUARE',
      image: 'assets/panorama.jpg',
      preview: 'assets/panorama-preview.jpg',
      position: [0, 0, 0],
      heading0: 0,
      links: [
        { to: 'p2', yaw: -25, label: 'TO THE CLIFF' },
        { to: 'p3', yaw: 75, label: 'EXPLORE THE ALLEY' }
      ],
      hotspots: [
        {
          id: 'cliff',
          title: 'THE CLIFF',
          text: 'The Bandiagara escarpment rises up to 500 metres above the plain. For centuries its rock shelters and caves have served as burial sites and sanctuaries. The Tellem built their dwellings in its walls long before the Dogon arrived, and the cliff remains the spiritual guardian of the whole region.',
          image: 'assets/hotspots/cliff.jpg',
          yaw: 10,
          pitch: 6
        },
        {
          id: 'houses',
          title: 'THE HOUSES',
          text: 'Built from banco — a mix of earth, straw and shea butter — these rectangular houses stay cool by day and warm at night. Walls must be replastered after every rainy season, a task that brings the whole family together. Low doors and small openings protect the family and its belongings.',
          image: 'assets/hotspots/houses.jpg',
          yaw: 28,
          pitch: -6
        },
        {
          id: 'life',
          title: 'VILLAGE LIFE',
          text: 'Life unfolds on the sandy square: children playing, women pounding millet, weavers and smiths at work. Markets, masked dances and village councils all take place here, in the heart of daily Dogon life.',
          image: 'assets/hotspots/life.jpg',
          yaw: -55,
          pitch: -13
        }
      ]
    },
    {
      id: 'p2',
      name: 'CLIFF BASE',
      image: 'assets/pano-02.jpg',
      preview: 'assets/pano-02-preview.jpg',
      position: [0, 0, -10],
      heading0: 180,
      links: [
        { to: 'p1', yaw: 150, label: 'BACK TO THE SQUARE' },
        { to: 'p3', yaw: -70, label: 'CONTINUE' }
      ],
      hotspots: [
        {
          id: 'cliff2',
          title: 'ROCK SHELTERS',
          text: 'The overhang of the cliff shelters dwellings and granaries. Tunnels and ladders once connected the levels, allowing villagers to store harvests high in the rock, safe from floods and raiders.',
          image: 'assets/hotspots/cliff.jpg',
          yaw: 15,
          pitch: 8
        },
        {
          id: 'roofs2',
          title: 'THATCHED CONES',
          text: 'Pointed thatched crowns cap the granaries at the foot of the cliff. Millet straw is bundled in thick overlapping layers so the heavy rains run off without touching the mud walls.',
          image: 'assets/hotspots/roofs.jpg',
          yaw: -40,
          pitch: -4
        }
      ]
    },
    {
      id: 'p3',
      name: 'GRANARY ALLEY',
      image: 'assets/pano-03.jpg',
      preview: 'assets/pano-03-preview.jpg',
      position: [8, 0, 0],
      heading0: 0,
      links: [
        { to: 'p1', yaw: -100, label: 'BACK TO THE SQUARE' },
        { to: 'p2', yaw: 140, label: 'TOWARDS THE CLIFF' }
      ],
      hotspots: [
        {
          id: 'granaries3',
          title: 'THE GRANARIES',
          text: 'Each family owns several granaries: one for millet, one for onions, others for personal belongings. The conical thatched roofs and sealed doors protect the harvest from rain, rodents and intruders.',
          image: 'assets/hotspots/granaries.jpg',
          yaw: -115,
          pitch: -2
        },
        {
          id: 'roofs3',
          title: 'THE TOGUNA',
          text: 'The toguna is the shaded meeting place of the village elders. Its low thatched roof keeps discussions calm — nobody can stand up abruptly under it — and its cool shade hosts the council at midday.',
          image: 'assets/hotspots/roofs.jpg',
          yaw: 110,
          pitch: -2
        }
      ]
    }
  ]
};
