document.addEventListener('DOMContentLoaded', function () {
    const playlistUrl = 'https://raw.githubusercontent.com/Khiyamturk01/KT/main/playlist.json';
    const playlistElement = document.getElementById('playlist');
    const audioElement = new Audio();
    const songTitleElement = document.getElementById('song-title');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeElement = document.getElementById('current-time');
    const totalTimeElement = document.getElementById('total-time');
    const playPauseButton = document.getElementById('play-pause');
    const shuffleButton = document.getElementById('shuffle');
    const repeatButton = document.getElementById('repeat');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');

    let originalPlaylist = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;
    let isShuffled = false;
    let isRepeating = false;
    let isMuted = false;

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const playAudio = (url) => {
        audioElement.src = url;
        audioElement.play().catch(err => {
            console.error('Playback failed:', err);
        });
    };

    const loadAndPlaySong = (song) => {
        playAudio(song.audioUrl);
        const currentlyActive = document.querySelector('#playlist li.active');
        if (currentlyActive) {
            currentlyActive.classList.remove('active');
        }
        document.querySelectorAll('#playlist li')[currentSongIndex].classList.add('active');

        songTitleElement.textContent = song.title;
    };

    const playNextSong = () => {
        currentSongIndex++;
        if (currentSongIndex >= currentPlaylist.length) {
            currentSongIndex = 0;
        }
        loadAndPlaySong(currentPlaylist[currentSongIndex]);
    };

    const playPreviousSong = () => {
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = currentPlaylist.length - 1;
        }
        loadAndPlaySong(currentPlaylist[currentSongIndex]);
    };

    const shufflePlaylist = () => {
        for (let i = currentPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentPlaylist[i], currentPlaylist[j]] = [currentPlaylist[j], currentPlaylist[i]];
        }
    };

    fetch(playlistUrl)
        .then(response => response.json())
        .then(playlist => {
            originalPlaylist = playlist;
            currentPlaylist = [...originalPlaylist];
            renderPlaylist(currentPlaylist);

            Sortable.create(playlistElement, {
                onEnd: function (evt) {
                    const element = currentPlaylist[evt.oldIndex];
                    currentPlaylist.splice(evt.oldIndex, 1);
                    currentPlaylist.splice(evt.newIndex, 0, element);
                    originalPlaylist = [...currentPlaylist];

                    if (evt.oldIndex === currentSongIndex) {
                        currentSongIndex = evt.newIndex;
                    } else if (evt.oldIndex < currentSongIndex && evt.newIndex >= currentSongIndex) {
                        currentSongIndex--;
                    } else if (evt.oldIndex > currentSongIndex && evt.newIndex <= currentSongIndex) {
                        currentSongIndex++;
                    }

                    loadAndPlaySong(currentPlaylist[currentSongIndex]);
                    renderPlaylist(currentPlaylist);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching playlist:', error);
            playlistElement.innerHTML = '<p>Error loading playlist.</p>';
        });

    function renderPlaylist(playlist) {
        playlistElement.innerHTML = '';
        playlist.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<i class="fas fa-music"></i> ${song.title}`;
            listItem.addEventListener('click', () => {
                currentSongIndex = index;
                loadAndPlaySong(currentPlaylist[currentSongIndex]);
            });
            playlistElement.appendChild(listItem);
        });
    }

    audioElement.addEventListener('timeupdate', function () {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;

        currentTimeElement.textContent = formatTime(currentTime);

        if (!isNaN(duration)) {
            const remainingTime = duration - currentTime;
            totalTimeElement.textContent = `-${formatTime(remainingTime)}`;
        }

        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
    });

    progressBar.addEventListener('input', function () {
        const seekTime = (progressBar.value / 100) * audioElement.duration;
        audioElement.currentTime = seekTime;
    });

    playPauseButton.addEventListener('click', function () {
        if (audioElement.paused) {
            audioElement.play();
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioElement.pause();
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    shuffleButton.addEventListener('click', function () {
        isShuffled = !isShuffled;
        if (isShuffled) {
            shufflePlaylist();
            shuffleButton.classList.add('active');
        } else {
            currentPlaylist = [...originalPlaylist];
            shuffleButton.classList.remove('active');
        }
        loadAndPlaySong(currentPlaylist[currentSongIndex]);
        renderPlaylist(currentPlaylist);
    });

    repeatButton.addEventListener('click', function () {
        isRepeating = !isRepeating;
        if (isRepeating) {
            repeatButton.classList.add('active');
        } else {
            repeatButton.classList.remove('active');
        }
    });

    audioElement.addEventListener('ended', function () {
        if (isRepeating) {
            audioElement.currentTime = 0;
            audioElement.play();
        } else {
            playNextSong();
        }
    });

    volumeSlider.addEventListener('input', function () {
        audioElement.volume = this.value / 100;
    });

    volumeIcon.addEventListener('click', function () {
        isMuted = !isMuted;
        audioElement.muted = isMuted;
        volumeIcon.innerHTML = isMuted
            ? '<i class="fas fa-volume-mute"></i>'
            : '<i class="fas fa-volume-up"></i>';
    });
});
