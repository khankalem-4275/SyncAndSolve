import { Socket } from "socket.io-client"

type SocketId = string

enum SocketEvent {
    JOIN_REQUEST = "join-request",
    JOIN_ACCEPTED = "join-accepted",
    USER_JOINED = "user-joined",
    USER_DISCONNECTED = "user-disconnected",
    SYNC_FILE_STRUCTURE = "sync-file-structure",
    DIRECTORY_CREATED = "directory-created",
    DIRECTORY_UPDATED = "directory-updated",
    DIRECTORY_RENAMED = "directory-renamed",
    DIRECTORY_DELETED = "directory-deleted",
    FILE_CREATED = "file-created",
    FILE_UPDATED = "file-updated",
    FILE_RENAMED = "file-renamed",
    FILE_DELETED = "file-deleted",
    USER_OFFLINE = "offline",
    USER_ONLINE = "online",
    SEND_MESSAGE = "send-message",
    RECEIVE_MESSAGE = "receive-message",
    TYPING_START = "typing-start",
    TYPING_PAUSE = "typing-pause",
    USERNAME_EXISTS = "username-exists",
    REQUEST_DRAWING = "request-drawing",
    SYNC_DRAWING = "sync-drawing",
    DRAWING_UPDATE = "drawing-update",
    SEND_ICE_CANDIDATE = "send_ice_candidate",
    RECEIVE_ICE_CANDIDATE = "receive_ice_candidate",
    SEND_ANSWER = "send_answer",
    RECEIVE_ANSWER = "receive_answer",
    SEND_OFFER = "send_offer",
    RECEIVE_OFFER = "receive_offer",
    SIGNAL_ICE_CANDIDATE = 'signal_ice_candidate',
    ADD_STREAM = 'add_stream',
    REMOVE_STREAM = 'remove_stream',
    SIGNAL_OFFER = 'signal_offer',
    SIGNAL_ANSWER = 'signal_answer',
}

interface SocketContext {
    socket: Socket
}

export { SocketEvent, SocketContext, SocketId }
