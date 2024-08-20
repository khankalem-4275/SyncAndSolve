import SplitterComponent from "@/components/SplitterComponent";
import ConnectionStatusPage from "@/components/connection/ConnectionStatusPage";
import Sidebar from "@/components/sidebar/Sidebar";
import WorkSpace from "@/components/workspace";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { USER_STATUS } from "@/types/user";

function EditorPage() {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { status, setCurrentUser, currentUser } = useAppContext();
    const location = useLocation();

    const localVideoRef = useRef<any>(null);
    const remoteVideoRef = useRef<any>(null);

    const [slideIn, setSlideIn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })).current;
    const localTracks = useRef<{ videoTrack: any; audioTrack: any } | null>(null);

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
            joinRoom(user);
        }
    }, [currentUser.username, location.state?.username, navigate, roomId, setCurrentUser]);

    const joinRoom = async (user: { username: string; roomId: string }) => {
        try {
            // Join Agora Channel
            await client.join('3ec3d2d90f194a7092eea8fe0dbbc51a', user.roomId, null, user.username);

            // Create Local Tracks
            localTracks.current = {
                videoTrack: await AgoraRTC.createCameraVideoTrack(),
                audioTrack: await AgoraRTC.createMicrophoneAudioTrack(),
            };

            // Play Local Video
            localTracks.current.videoTrack.play(localVideoRef.current);

            // Publish Local Tracks
            await client.publish(Object.values(localTracks.current));

            // Handle Remote User Published
            client.on("user-published", async (remoteUser, mediaType) => {
                await client.subscribe(remoteUser, mediaType);
                if (mediaType === "video" && remoteUser.videoTrack) {
                    remoteUser.videoTrack.play(remoteVideoRef.current);
                }
                if (mediaType === "audio" && remoteUser.audioTrack) {
                    remoteUser.audioTrack.play();
                }
            });

            // Handle Remote User Unpublished
            client.on("user-unpublished", (remoteUser) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            });
        } catch (error) {
            console.error("Failed to join Agora channel:", error);
        }
    };

    const toggleVideo = () => {
        if (localTracks.current?.videoTrack) {
            if (isVideoOn) {
                localTracks.current.videoTrack.setEnabled(false);
            } else {
                localTracks.current.videoTrack.setEnabled(true);
            }
            setIsVideoOn(!isVideoOn);
        }
    };

    const toggleMic = () => {
        if (localTracks.current?.audioTrack) {
            if (isMicOn) {
                localTracks.current.audioTrack.setEnabled(false);
            } else {
                localTracks.current.audioTrack.setEnabled(true);
            }
            setIsMicOn(!isMicOn);
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

                    {/* Draggable Local Video Stream */}
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
