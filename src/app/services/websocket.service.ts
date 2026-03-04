// services/websocket.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket;
    private bookingUpdates$ = new Subject<any>();

    constructor() {
        this.socket = io(this.resolveSocketUrl());

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

        this.socket.on('blog-created', (data) => {
            this.bookingUpdates$.next({
                type: 'blog-created',
                data: data
            });
        });

        this.socket.on('post-created', (data) => {
            this.bookingUpdates$.next({
                type: 'post-created',
                data: data
            });
        });

        this.socket.on('blog-submitted', (data) => {
            this.bookingUpdates$.next({
                type: 'blog-submitted',
                data: data
            });
        });

        this.socket.on('comment-created', (data) => {
            this.bookingUpdates$.next({
                type: 'comment-created',
                data: data
            });
        });

        this.socket.on('review-created', (data) => {
            this.bookingUpdates$.next({
                type: 'review-created',
                data: data
            });
        });

        this.socket.on('comment-submitted', (data) => {
            this.bookingUpdates$.next({
                type: 'comment-submitted',
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

    private resolveSocketUrl(): string {
        const explicit = (environment as any)?.socketUrl;
        if (explicit) return explicit;

        const base = environment.baseUrl || '';
        // baseUrl format: http://host:port/api/auth -> socket host: http://host:port
        const url = base.replace(/\/api\/auth\/?$/, '');
        return url || 'http://localhost:4001';
    }
}
