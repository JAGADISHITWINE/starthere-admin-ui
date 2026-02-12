import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Users } from './users';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
  avatar: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class UsersComponent implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'all';
  user: any = null;
  bookings: any[] = [];
  isLoading = true;
  isDetailView = false;
  selectedSegment = 'details';

  statusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blocked', label: 'Blocked' }
  ];

  users: User[] = [];

  constructor(private userService: Users,     private route: ActivatedRoute,
    private router:          Router,
    private loadingCtrl:     LoadingController,
    private alertCtrl:       AlertController) { }

  ngOnInit() {
    this.userService.getAllUsers().subscribe((res: any) => {
      if(res.success == true){
        this.users = res.data;
        this.isLoading = false;
        this.isDetailView = false;
      }
      
    })
  }

  get filteredUsers(): User[] {
    let filtered = this.users;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(u => u.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }
    return filtered;
  }


  async viewUser(id: any) {
    const loading = await this.loadingCtrl.create({ message: 'Loading...' });
    await loading.present();

    this.userService.getUserById(id).subscribe({
      next: (res: any) => {
        loading.dismiss();
        this.isLoading = false;
        if (res.response == true) {
          this.user     = res.data.user;
          this.bookings = res.data.bookings || [];
          this.isDetailView = true;
        }
      },
      error: () => {
        loading.dismiss();
        this.isLoading = false;
        this.isDetailView = false;
      }
    });
  }

  async confirmBlock(user: any) {
    const alert = await this.alertCtrl.create({
      header:  'Block User',
      message: `Are you sure you want to block ${user.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Block',
          role: 'destructive',
          handler: () => this.blockUser(user)
        }
      ]
    });
    await alert.present();
  }

  blockUser(user: any) {
    this.userService.blockUser(user.id).subscribe((res: any) => {
      if (res.response) {
        this.user.status = 'blocked';
      }
    });
  }

  activateUser(user: any) {
    this.userService.activateUser(user.id).subscribe((res: any) => {
      if (res.response) {
        this.user.status = 'active';
      }
    });
  }

  getAvatar(user: any) {
    return user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=667eea&color=fff&size=128`;
  }

  getStatusColor(status: string) {
    return status === 'active' ? 'success' : status === 'blocked' ? 'danger' : 'medium';
  }

  getBookingStatusColor(status: string) {
    const map: any = { confirmed: 'success', pending: 'warning', cancelled: 'danger', completed: 'primary' };
    return map[status] || 'medium';
  }

  goBack(){
    this.router.navigateByUrl('/users')
  }

}
