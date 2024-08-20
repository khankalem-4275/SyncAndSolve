import SplitterComponent from "@/components/SplitterComponent";
import ConnectionStatusPage from "@/components/connection/ConnectionStatusPage";
import Sidebar from "@/components/sidebar/Sidebar";
import WorkSpace from "@/components/workspace";
import { useAppContext } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import useFullScreen from "@/hooks/useFullScreen";
import useUserActivity from "@/hooks/useUserActivity";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Draggable from 'react-draggable';
import { USER_STATUS } from "@/types/user";
import { SocketEvent } from "@/types/socket";

// FontAwesome Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';

// Updated SocketEvent Type

function EditorPage() {
    useUserActivity(); // Listen user online/offline status
    useFullScreen(); // Enable fullscreen mode

    const navigate = useNavigate();
    const { roomId } = useParams();
    const { status, setCurrentUser, currentUser } = useAppContext();
    const { socket } = useSocket();
    const location = useLocation();
    const localVideoRef = useRef<any>(null);
    const remoteVideoRef = useRef<any>(null);

    const [slideIn, setSlideIn] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    const pc = useRef<RTCPeerConnection>(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        setTimeout(() => setSlideIn(true), 100); // Smooth slide animation
    }, []);

    useEffect(() => {
        if (currentUser.username.length > 0) return;
        const username = location.state?.username;
        if (username === undefined) {
            navigate("/", { state: { roomId } });
        } else if (roomId) {
            const user = { username, roomId };
            setCurrentUser(user);
            socket.emit(SocketEvent.JOIN_REQUEST, user);
        }
    }, [currentUser.username, location.state?.username, navigate, roomId, setCurrentUser, socket]);

    useEffect(() => {
        const getMediaStream = async () => {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(userStream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = userStream;
                }

                userStream.getTracks().forEach(track => pc.addTrack(track, userStream));

                socket.on(SocketEvent.RECEIVE_OFFER, async ({ offer }) => {
                    if (offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit(SocketEvent.SEND_ANSWER, { roomId, answer });
                    }
                });

                socket.on(SocketEvent.RECEIVE_ANSWER, async ({ answer }) => {
                    if (answer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                });

                socket.on(SocketEvent.RECEIVE_ICE_CANDIDATE, async ({ candidate }) => {
                    if (candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                });

                pc.onicecandidate = event => {
                    if (event.candidate) {
                        socket.emit(SocketEvent.SEND_ICE_CANDIDATE, { roomId, candidate: event.candidate });
                    }
                };

                pc.ontrack = event => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                const createOffer = async () => {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit(SocketEvent.SEND_OFFER, { roomId, offer });
                };

                if (location.state?.isInitiator) {
                    createOffer();
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
            }
        };

        getMediaStream();

        return () => {
            pc.close();
        };
    }, [pc, roomId, socket, location.state?.isInitiator]);

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

                    {/* Draggable Video Stream */}
                    <Draggable>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexGrow: 1 }}>
                            <video
                                ref={localVideoRef}
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

                    {/* Remote Video Stream */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', flexGrow: 1 }}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            style={{
                                width: 'auto',
                                height: 'auto',
                                zIndex: 1000,
                                borderRadius: '8px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                margin: '20px',
                            }}
                        />
                    </div>
                </div>
            </SplitterComponent>
        </div>
    );
}

export default EditorPage;
