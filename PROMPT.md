# PROMPT POUR RECONSTRUIRE CE PROJET AVEC UNE AUTRE IA

Copie-colle le texte ci-dessous dans une autre IA pour reconstruire ou continuer ce projet.

---

Je veux que tu crées une visite virtuelle immersive 360° d'un village dogon (escarpement de Bandiagara, Mali), en application web statique sans framework ni build tool, optimisée mobile-first.

**Stack technique :**
- HTML/CSS/JavaScript ES modules purs, aucun bundler
- Three.js r160 chargé **localement** dans `vendor/three/` (pas de CDN) avec importmap : `"three": "./vendor/three/build/three.module.js"` et `"three/addons/": "./vendor/three/addons/"` (inclure GLTFLoader.js et utils/BufferGeometryUtils.js)
- Servir obligatoirement via HTTP local (`python -m http.server`), pas de `file://`

**Structure des fichiers :**
```
index.html          → UI (topbar, minimap, panneaux, bottombar)
css/style.css
js/main.js          → bootstrap + boucle de rendu (renderer.setAnimationLoop)
js/tour-data.js     → données de la visite (graphe de nodes déclaratif)
js/TourController.js→ sphères skybox A/B avec cross-fade, transitions
js/spatial.js       → maths yaw/pitch/heading → position 3D
js/CameraRig.js     → caméra lon/lat OU quaternion gyroscope + FOV fluide
js/GyroControls.js  → DeviceOrientationEvent + permission iOS
js/TouchControls.js → Pointer Events : 1 doigt = regard, 2 doigts = pinch,
                      molette souris = zoom, flèches clavier = regard, +/- = zoom
js/AudioManager.js  → ambiance : cherche assets/audio/{nodeId}.mp3, sinon
                      assets/audio/ambience.mp3, sinon vent de synthèse WebAudio
js/HotspotSystem.js → markers DOM projetés en espace écran
js/GuideSystem.js   → guide 3D optionnel (GLB auto-détecté, silencieux si absent)
assets/             → panoramas equirectangulaires + versions -preview (512x256)
vendor/three/
```

**Fonctionnalités clés :**
- Graphe de nodes : chaque node = `{ id, name, image, preview, position [x,y,z], heading0, links [{to, yaw, label}] }`
- Navigation par flèches DOM superposées, projetées depuis la 3D ; clic → transition cinématique 2,4s (ease-in-out cubic) avec fondu croisé des sphères et déplacement caméra
- Chargement progressif : preview d'abord puis haute résolution, préchargement des voisins, dispose des textures lointaines
- Historique interne : bouton retour qui revient au node précédent (`goBack()`), désactivé si vide
- Callbacks `onNodeChange` et `onTravelStart` passés au constructeur (pas de monkey-patching)
- Minimap avec points cliquables (current/connecté/loin), bouton son, recentrage, panneau ⓘ
- Panneaux info : `<section class="panel">` — **ne pas oublier la classe `panel`, sinon le CSS ne s'applique pas**
- Gyro iOS : bouton "Tap to activate motion sensors" si `DeviceOrientationEvent.requestPermission` existe

**Workflow images (important) :**
- Les panoramas doivent être en JPG equirectangular (ratio 2:1, ex. 2880x1440 ou 1774x887)
- Si l'utilisateur fournit un PNG, le convertir en JPEG qualité 85 + générer un preview 512x256 qualité 80
- Remplacer une image = garder le même nom de fichier (`pano-02.jpg` + `pano-02-preview.jpg`) + Ctrl+Shift+R pour vider le cache navigateur

**Git :** repo existant sur GitHub, commits concis en anglais, push sur `origin/master` après chaque modification validée par l'utilisateur.

Commence par générer tous les fichiers, puis vérifie la syntaxe avec `node --check --input-type=module` et teste les URLs avec un serveur HTTP local.
