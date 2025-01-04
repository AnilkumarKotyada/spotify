import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";

export const PlayerContext = createContext();

const PlayerContextProvider = (props) => {
    const audioRef = useRef();
    const seekBg = useRef();
    const seekBar = useRef();

    const url = "http://localhost:4000";

    const [songsData, setSongsData] = useState([]);
    const [albumsData, setAlbumsData] = useState([]);
    const [track, setTrack] = useState(null);
    const [playStatus, setPlayStatus] = useState(false);
    const [time, setTime] = useState({
        currentTime: { second: 0, minute: 0 },
        totalTime: { second: 0, minute: 0 },
    });

    const play = () => {
        if (audioRef.current) {
            audioRef.current.play();
            setPlayStatus(true);
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setPlayStatus(false);
        }
    };

    const playWithId = (id) => {
        const selectedSong = songsData.find((item) => item._id === id);
        if (selectedSong) {
            setTrack(selectedSong);
        }
    };

    const previous = () => {
        const currentIndex = songsData.findIndex((item) => item._id === track?._id);
        if (currentIndex > 0) {
            setTrack(songsData[currentIndex - 1]);
        }
    };

    const next = () => {
        const currentIndex = songsData.findIndex((item) => item._id === track?._id);
        if (currentIndex < songsData.length - 1) {
            setTrack(songsData[currentIndex + 1]);
        }
    };

    const seekSong = (e) => {
        if (audioRef.current && seekBg.current) {
            audioRef.current.currentTime =
                (e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration;
        }
    };

    const getSongsData = async () => {
        try {
            const response = await axios.get(`${url}/api/song/list`);
            setSongsData(response.data.songs);
            setTrack(response.data.songs[0]); // Set the first song initially
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    };

    const getAlbumsData = async () => {
        try {
            const response = await axios.get(`${url}/api/album/list`);
            setAlbumsData(response.data.albums);
        } catch (error) {
            console.error("Error fetching albums:", error);
        }
    };

    useEffect(() => {
        const updateTime = () => {
            if (audioRef.current) {
                setTime({
                    currentTime: {
                        second: Math.floor(audioRef.current.currentTime % 60),
                        minute: Math.floor(audioRef.current.currentTime / 60),
                    },
                    totalTime: {
                        second: Math.floor(audioRef.current.duration % 60) || 0,
                        minute: Math.floor(audioRef.current.duration / 60) || 0,
                    },
                });

                if (seekBar.current && audioRef.current.duration) {
                    seekBar.current.style.width = 
                        `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%`;
                }
            }
        };

        if (audioRef.current) {
            audioRef.current.ontimeupdate = updateTime;

            // Play the next song when the current song ends
            audioRef.current.onended = () => {
                next();
            };
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.ontimeupdate = null;
                audioRef.current.onended = null;
            }
        };
    }, [audioRef, seekBar, track]);

    useEffect(() => {
        getSongsData();
        getAlbumsData();
    }, []);

    useEffect(() => {
        if (track) {
            audioRef.current.src = track.file;
            audioRef.current.play().catch((error) => console.error("Audio playback error:", error));
            setPlayStatus(true);
        }
    }, [track]);

    const contextValue = {
        audioRef,
        seekBg,
        seekBar,
        track,
        playStatus,
        time,
        play,
        pause,
        playWithId,
        previous,
        next,
        seekSong,
        songsData,
        albumsData,
    };

    return <PlayerContext.Provider value={contextValue}>{props.children}</PlayerContext.Provider>;
};

export default PlayerContextProvider;
