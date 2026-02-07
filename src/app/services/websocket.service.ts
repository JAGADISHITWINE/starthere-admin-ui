// services/websocket.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket;
    private bookingUpdates$ = new Subject<any>();

    constructor() {
        this.socket = io('http://localhost:4001');

        this.socket.on('connect', () => {
            this.joinAdminRoom();
        });

        this.setupListeners();
    }

    connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    private setupListeners() {
        this.socket.on('booking-completed', (data) => {
            this.bookingUpdates$.next({
                type: 'completed',
                data: data
            });
        });

        // New booking created by user
        this.socket.on('booking-created', (data) => {
            this.bookingUpdates$.next({
                type: 'created',
                data: data
            });
        });

        this.socket.on('batch-completed', (data) => {
            this.bookingUpdates$.next({
                type: 'batch-completed',
                data: data
            });
        });
    }

    getBookingUpdates(): Observable<any> {
        return this.bookingUpdates$.asObservable();
    }

    // Join admin room for updates
    joinAdminRoom() {
        this.socket.emit('join-admin-room');
    }
}