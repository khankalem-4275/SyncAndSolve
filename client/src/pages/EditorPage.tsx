import SplitterComponent from "@/components/SplitterComponent";
import ConnectionStatusPage from "@/components/connection/ConnectionStatusPage";
import Sidebar from "@/components/sidebar/Sidebar";
import WorkSpace from "@/components/workspace";
import { useAppContext } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import useFullScreen from "@/hooks/useFullScreen";
import useUserActivity from "@/hooks/useUserActivity";
import { SocketEvent } from "@/types/socket";
import { USER_STATUS, User } from "@/types/user";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Draggable from "react-draggable";

// FontAwesome Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';

function EditorPage() {
    // Listen user online/offline status
    useUserActivity();
    // Enable fullscreen mode
    useFullScreen();
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { status, setCurrentUser, currentUser } = useAppContext();
    const { socket } = useSocket();
    const location = useLocation();
    const videoRef1 = useRef(null);
    const videoRef2 = useRef(null);

    const [slideIn, setSlideIn] = useState(false); // State to control sliding
    const [stream, setStream] = useState(null); // Store the media stream
    const [isVideoOn, setIsVideoOn] = useState(true); // State for video toggle
    const [isMicOn, setIsMicOn] = useState(true); // State for microphone toggle

    useEffect(() => {
        setTimeout(() => setSlideIn(true), 100); // Delay the slide to make it smooth
    }, []);

    useEffect(() => {
        if (currentUser.username.length > 0) return;
        const username = location.state?.username;
        if (username === undefined) {
            navigate("/", {
                state: { roomId },
            });
        } else if (roomId) {
            const user: User = { username, roomId };
            setCurrentUser(user);
            socket.emit(SocketEvent.JOIN_REQUEST, user);
        }
    }, [
        currentUser.username,
        location.state?.username,
        navigate,
        roomId,
        setCurrentUser,
        socket,
    ]);

    // Request microphone and camera access
    useEffect(() => {
        const getMediaStream = async () => {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setStream(userStream);
                if (videoRef1.current) {
                    videoRef1.current.srcObject = userStream;
                }
                if (videoRef2.current) {
                    videoRef2.current.srcObject = userStream;
                }
            } catch (error) {
                console.error("Error accessing media devices.", error);
            }
        };

        getMediaStream();
    }, []);

    // Toggle Video On/Off
    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
            }
        }
    };

    // Toggle Microphone On/Off
    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    };

    if (status === USER_STATUS.CONNECTION_FAILED) {
        return <ConnectionStatusPage />;
    }

    return (
        <div
            style={{
                transform: slideIn ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.5s ease-in-out",
                height: "100vh",
                width: "100vw",
            }}
        >
            <SplitterComponent>
                <Sidebar />
                <WorkSpace />
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1001, display: 'flex', gap: '10px' }}>
                        {/* Video and Mic Toggle Icons */}
                        <FontAwesomeIcon 
                            icon={isVideoOn ? faVideo : faVideoSlash} 
                            onClick={toggleVideo} 
                            style={{ fontSize: '24px', cursor: 'pointer', color: isVideoOn ? 'green' : 'red' }} 
                        />
                        <FontAwesomeIcon 
                            icon={isMicOn ? faMicrophone : faMicrophoneSlash} 
                            onClick={toggleMic} 
                            style={{ fontSize: '24px', cursor: 'pointer', color: isMicOn ? 'green' : 'red' }} 
                        />
                    </div>

                    {/* First Video Window */}
                    <Draggable>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexGrow: 1 }}>
                            <video 
                                ref={videoRef1} 
                                autoPlay 
                                muted 
                                style={{ 
                                    width: 'auto',  
                                    height: 'auto',  
                                    zIndex: 1000,  
                                    borderRadius: '8px',  
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',  
                                    cursor: 'move',  
                                    margin: '20px',  
                                }} 
                            />
                        </div>
                    </Draggable>

                    {/* Second Video Window */}
                    <Draggable>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexGrow: 1 }}>
                            <video 
                                ref={videoRef2} 
                                autoPlay 
                                muted 
                                style={{ 
                                    width: 'auto',  
                                    height: 'auto',  
                                    zIndex: 1000,  
                                    borderRadius: '8px',  
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',  
                                    cursor: 'move',  
                                    margin: '20px',  
                                }} 
                            />
                        </div>
                    </Draggable>
                </div>
            </SplitterComponent>
        </div>
    );
}

export default EditorPage;
