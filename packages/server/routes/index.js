const fs = require('fs');
const qs = require('qs');
const path = require('path');
const express = require('express');
const {
  getAbout,
  getLibraryStats,
  getAllNotAvailable,
  getAllMovies,
  getMostPopularMovies,
  getHighestRatedMovies,
  getRecentlyAddedMovies,
  getMovieGenres,
  getMoviesByGenre,
  getRandomMovie,
  getMovie,
  getAllTVShows,
  getMostPopularTVShows,
  getHighestRatedTVShows,
  getRecentlyAddedTVShows,
  getTVShowGenres,
  getTVShowsByGenre,
  getRandomTVShow,
  getTVShow,
  getRandomMovieOrTVShow,
  getAllAlbums,
  getRecentlyAddedAlbums,
  getLatestAlbumReleases,
  getMusicAlbum,
  getAllArtists,
  getMostPopularArtists,
  getAllSongs,
  getRecentlyAddedSongs,
  getMovieFilePath,
  getSongFilePath,
  getEpisodeFilePath,
  searchMoviesAndTV,
  searchMusic,
  externalSearch,
} = require('../data');
const { moveMovieFile, moveEpisodeFile, moveSongFile } = require('../models');
const authController = require('../controller/authController');
const router = express.Router();

const readStreamMp4 = (req, res, file_path) => {
  const stat = fs.statSync(file_path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(file_path, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(file_path).pipe(res);
  }
};

const readStreamMpeg = (req, res, file_path) => {
  var stat = fs.statSync(file_path);
  var total = stat.size;
  if (req.headers.range) {
    var range = req.headers.range;
    var parts = range.replace(/bytes=/, '').split('-');
    var partialstart = parts[0];
    var partialend = parts[1];

    var start = parseInt(partialstart, 10);
    var end = partialend ? parseInt(partialend, 10) : total - 1;
    var chunksize = end - start + 1;
    var readStream = fs.createReadStream(file_path, { start: start, end: end });
    res.writeHead(206, {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    readStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': 'audio/mpeg',
    });
    fs.createReadStream(file_path).pipe(res);
  }
};

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.authenticate, authController.getProfile);

router.get('/about', (req, res) => {
  res.json(getAbout());
});

router.get('/library/stats', async (req, res) => {
  res.json(await getLibraryStats());
});

router.get('/not_available', async (req, res) => {
  res.json(await getAllNotAvailable());
});

router.get('/services/search', async (req, res) => {
  res.json(await externalSearch(req.query.type, req.query.q));
});

router.post('/movies/add', async (req, res) => {
  console.log(req.body);
  res.json(await moveMovieFile(req.body));
});

router.post('/tv/episodes/add', async (req, res) => {
  res.json(await moveEpisodeFile(req.body));
});

router.post('/music/songs/add', async (req, res) => {
  res.json(await moveSongFile(req.body));
});

router.get('/movies', async (req, res) => {
  res.json(await getAllMovies());
});

router.get('/movies/most_popular', async (req, res) => {
  res.json(await getMostPopularMovies());
});

router.get('/movies/highest_rated', async (req, res) => {
  res.json(await getHighestRatedMovies());
});

router.get('/movies/recently_added', async (req, res) => {
  res.json(await getRecentlyAddedMovies());
});

router.get('/movies/genres', async (req, res) => {
  res.json(await getMovieGenres());
});

router.get('/movies/genre/:name', async (req, res) => {
  res.json(await getMoviesByGenre(req.params.name));
});

router.get('/movies/random', async (req, res) => {
  res.json(await getRandomMovie());
});

router.get('/movies/:id', async (req, res) => {
  res.json(await getMovie(req.params.id));
});

router.get('/tv', async (req, res) => {
  res.json(await getAllTVShows());
});

router.get('/tv/most_popular', async (req, res) => {
  res.json(await getMostPopularTVShows());
});

router.get('/tv/highest_rated', async (req, res) => {
  res.json(await getHighestRatedTVShows());
});

router.get('/tv/recently_added', async (req, res) => {
  res.json(await getRecentlyAddedTVShows());
});

router.get('/tv/genres', async (req, res) => {
  res.json(await getTVShowGenres());
});

router.get('/tv/genre/:name', async (req, res) => {
  res.json(await getTVShowsByGenre(req.params.name));
});

router.get('/tv/random', async (req, res) => {
  res.json(await getRandomTVShow());
});

router.get('/tv/:id', async (req, res) => {
  res.json(await getTVShow(req.params.id));
});

router.get('/music/albums/recently_added', async (req, res) => {
  res.json(await getRecentlyAddedAlbums());
});

router.get('/music/albums/latest', async (req, res) => {
  res.json(await getLatestAlbumReleases());
});

router.get('/music/artists', async (req, res) => {
  res.json(await getAllArtists());
});

router.get('/music/artists/most_popular', async (req, res) => {
  res.json(await getMostPopularArtists());
});

router.get('/music/albums', async (req, res) => {
  res.json(await getAllAlbums());
});

router.get('/music/albums/:id', async (req, res) => {
  if (req.params.id == 'undefined') return res.json({});
  res.json(await getMusicAlbum(req.params.id));
});

router.get('/music/songs', async (req, res) => {
  res.json(await getAllSongs());
});

router.get('/music/songs/recently_added', async (req, res) => {
  res.json(await getRecentlyAddedSongs());
});

router.get('/movies/:id', async (req, res) => {
  readStreamMp4(req, res, await getMovieFilePath(req.params.id));
});

router.get(
  '/tv/:tv_show_id/:season_number/:episode_number',
  async (req, res) => {
    readStreamMp4(
      req,
      res,
      await getEpisodeFilePath(
        req.params.tv_show_id,
        req.params.season_number,
        req.params.episode_number
      )
    );
  }
);

router.get('/music/:album_id/:disc_number/:track_number', async (req, res) => {
  readStreamMpeg(
    req,
    res,
    await getSongFilePath(
      req.params.album_id,
      req.params.disc_number,
      req.params.track_number
    )
  );
});

router.get('/watch/search', async (req, res) => {
  const keyword = qs.parse(req.query).q;
  console.log(`keyword is "${keyword}"`);
  console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
  res.json(await searchMoviesAndTV(keyword));
});

router.get('/listen/search', async (req, res) => {
  const keyword = qs.parse(req.query).q;
  console.log(`keyword is "${keyword}"`);
  console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
  res.json(await searchMusic(keyword));
});

router.get('/watch/billboard', async (req, res) => {
  const billboardItem = await getRandomMovieOrTVShow();
  // get by id: getMovie(), getTVShow()
  res.json(billboardItem);
});

// Handles any requests that don't match the routes above
if (process.env.NODE_ENV == 'production') {
  router.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build/index.html'));
  });
}

module.exports = router;