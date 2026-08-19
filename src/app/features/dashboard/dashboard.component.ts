import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardService } from '../../core/services/board.service';
import { ToastService } from '../../core/services/toast.service';
import { BoardModalComponent } from '../../shared/components/board-modal/board-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BoardModalComponent, NavbarComponent, ConfirmModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  boards: any[] = [];
  loading = false;
  error = '';
  showBoardModal = false;
  showDeleteConfirmModal = false;
  boardToDelete: any = null;
  updatingCoverBoardId: number | null = null;
  searchQuery = '';

  constructor(
    private boardService: BoardService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('search') || '').trim().toLowerCase();
    });
    this.loadBoards();
  }

  loadBoards(): void {
    this.loading = true;
    this.boardService.getBoards().subscribe({
      next: (response: any) => {
        this.loading = false;
        this.boards = response.boards || [];
      },
      error: (error: any) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des boards';
        this.toastService.error('Erreur', 'Impossible de charger vos boards');
        console.error(error);
      }
    });
  }


  filteredBoards(): any[] {
    if (!this.searchQuery) return this.boards;
    return this.boards.filter((board) => [board.title, board.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(this.searchQuery));
  }

  navigateToBoard(boardId: number): void {
    this.router.navigate(['/board', boardId]);
  }

  openBoardModal(): void {
    this.showBoardModal = true;
  }

  closeBoardModal(): void {
    this.showBoardModal = false;
  }



  getInitials(member: any): string {
    const label = member?.fullName || member?.email || 'U';
    return label.split(' ').map((part: string) => part.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getBoardBackground(board: any): string {
    if (board.coverImageUrl) {
      return `linear-gradient(rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.18)), url(${board.coverImageUrl}) center / cover no-repeat`;
    }
    return board.backgroundColor || 'var(--board-bg)';
  }

  getBoardAccent(board: any): string {
    return board.backgroundColor || 'var(--accent)';
  }

  hasCoverImage(board: any): boolean {
    return !!board.coverImageUrl;
  }


  promptDeleteBoard(board: any, event: Event): void {
    event.stopPropagation();
    this.boardToDelete = board;
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteBoard(): void {
    this.boardToDelete = null;
    this.showDeleteConfirmModal = false;
  }

  confirmDeleteBoard(): void {
    if (!this.boardToDelete) return;

    this.boardService.deleteBoard(String(this.boardToDelete.id)).subscribe({
      next: () => {
        this.toastService.success('Succes', 'Board supprime');
        this.cancelDeleteBoard();
        this.loadBoards();
      },
      error: (error: any) => {
        this.toastService.error('Erreur', error.error?.message || 'Impossible de supprimer le board');
        this.cancelDeleteBoard();
      }
    });
  }

  updateBoardCover(board: any, event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.error('Erreur', 'Le fichier doit etre une image');
      input.value = '';
      return;
    }

    if (file.size > 900 * 1024) {
      this.toastService.error('Erreur', 'Image trop lourde : 900 Ko maximum');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.updatingCoverBoardId = board.id;
      this.boardService.updateBoard(String(board.id), { coverImageUrl: reader.result as string }).subscribe({
        next: (response: any) => {
          this.boards = this.boards.map((item) => item.id === board.id ? (response.board || item) : item);
          this.updatingCoverBoardId = null;
          this.toastService.success('Succes', 'Couverture mise a jour');
        },
        error: (error: any) => {
          this.updatingCoverBoardId = null;
          this.toastService.error('Erreur', error.error?.message || 'Impossible de mettre a jour la couverture');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  clearBoardCover(board: any, event: Event): void {
    event.stopPropagation();
    this.boardService.updateBoard(String(board.id), { coverImageUrl: null }).subscribe({
      next: (response: any) => {
        this.boards = this.boards.map((item) => item.id === board.id ? (response.board || item) : item);
        this.toastService.success('Succes', 'Couverture retiree');
      },
      error: (error: any) => {
        this.toastService.error('Erreur', error.error?.message || 'Impossible de retirer la couverture');
      }
    });
  }

  createBoard(boardData: { title: string; description: string; backgroundColor: string; coverImageUrl?: string | null }): void {
    this.boardService.createBoard(boardData).subscribe({
      next: (response: any) => {
        this.toastService.success('Succès', 'Board créé avec succès');
        this.closeBoardModal();
        this.loadBoards();
      },
      error: (error: any) => {
        this.toastService.error('Erreur', error.error?.message || 'Impossible de créer le board');
        console.error(error);
      }
    });
  }
}
