import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';
import {
  DropdownGroup,
  DropdownManagerService,
  DropdownOption,
  DropdownOptionStatus,
} from './dropdown-manager.service';

@Component({
  selector: 'app-dropdown-manager',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './dropdown-manager.component.html',
  styleUrls: ['./dropdown-manager.component.scss'],
})
export class DropdownManagerComponent implements OnInit {
  groups: DropdownGroup[] = [];
  loading = false;

  selectedGroupKey = '';
  newGroupKey = '';
  newGroupLabel = '';
  newGroupPage = '';
  newOptionLabel = '';
  editingOptionId: string | null = null;
  editingLabel = '';

  constructor(private dropdownService: DropdownManagerService) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  get selectedGroup(): DropdownGroup | undefined {
    return this.groups.find((group) => group.key === this.selectedGroupKey);
  }

  selectGroup(key: string): void {
    this.selectedGroupKey = key;
    this.cancelEdit();
  }

  loadGroups(): void {
    this.loading = true;
    this.dropdownService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        if (!this.selectedGroupKey && groups.length > 0) {
          this.selectedGroupKey = groups[0].key;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  addOption(): void {
    const group = this.selectedGroup;
    const label = this.newOptionLabel.trim();
    if (!group || !label) return;

    this.dropdownService.addOption(group.key, label).subscribe((groups) => {
      this.groups = groups;
      this.newOptionLabel = '';
    });
  }

  addGroup(): void {
    const key = this.newGroupKey.trim();
    const label = this.newGroupLabel.trim();
    const page = this.newGroupPage.trim();
    if (!key || !label || !page) return;

    this.dropdownService.createGroup(key, label, page).subscribe((groups) => {
      this.groups = groups;
      this.selectedGroupKey = groups[groups.length - 1]?.key || this.selectedGroupKey;
      this.newGroupKey = '';
      this.newGroupLabel = '';
      this.newGroupPage = '';
    });
  }

  startEdit(option: DropdownOption): void {
    this.editingOptionId = option.id;
    this.editingLabel = option.label;
  }

  saveEdit(option: DropdownOption): void {
    const group = this.selectedGroup;
    const label = this.editingLabel.trim();
    if (!group || !label) return;

    this.dropdownService.updateOption(group.key, option.id, label).subscribe((groups) => {
      this.groups = groups;
      this.cancelEdit();
    });
  }

  cancelEdit(): void {
    this.editingOptionId = null;
    this.editingLabel = '';
  }

  toggleStatus(option: DropdownOption): void {
    const group = this.selectedGroup;
    if (!group) return;

    const nextStatus: DropdownOptionStatus = option.status === 'active' ? 'inactive' : 'active';
    this.dropdownService.setOptionStatus(group.key, option.id, nextStatus).subscribe((groups) => {
      this.groups = groups;
    });
  }

  deleteOption(option: DropdownOption): void {
    const group = this.selectedGroup;
    if (!group) return;

    this.dropdownService.deleteOption(group.key, option.id).subscribe((groups) => {
      this.groups = groups;
    });
  }
}
