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
        { to: 'p2', yaw: -25, label: 'TO THE ALLEY' },
        { to: 'p3', yaw: 75, label: 'EXPLORE THE CLIFF' }
      ]
    },
    {
      id: 'p2',
      name: 'THE ALLEY',
      image: 'assets/pano-02.jpg',
      preview: 'assets/pano-02-preview.jpg',
      position: [0, 0, -10],
      heading0: 180,
      links: [
        { to: 'p1', yaw: 150, label: 'BACK TO THE SQUARE' },
        { to: 'p3', yaw: -70, label: 'CONTINUE' }
      ]
    },
    {
      id: 'p3',
      name: 'THE CLIFF',
      image: 'assets/pano-03.jpg',
      preview: 'assets/pano-03-preview.jpg',
      position: [8, 0, 0],
      heading0: 0,
      links: [
        { to: 'p1', yaw: -100, label: 'BACK TO THE SQUARE' },
        { to: 'p2', yaw: 140, label: 'TOWARDS THE ALLEY' }
      ]
    }
  ]
};
