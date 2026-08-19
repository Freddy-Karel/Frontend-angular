import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BoardService } from '../../core/services/board.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { CardModalComponent } from './components/card-modal/card-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ListModalComponent } from '../../shared/components/list-modal/list-modal.component';
import { InlineCardFormComponent } from '../../shared/components/inline-card-form/inline-card-form.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Board, List, Card, User, Subtask, Comment } from '../../core/models/board.model';

type BoardMemberLike = Partial<User> & { userId?: number; role?: string };

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, CardModalComponent, NavbarComponent, ListModalComponent, InlineCardFormComponent, ConfirmModalComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {
  boardId!: string;
  board = signal<Board | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  collapsedListIds = signal<Set<number>>(new Set());

  lists = computed(() => {
    const b = this.board();
    if (!b?.lists) return [];
    return [...b.lists].sort((a, b) => a.position - b.position);
  });

  totalCards = computed(() => this.lists().reduce((total, list) => total + (list.cards?.length || 0), 0));
  visibleCards = computed(() => this.lists().reduce((total, list) => total + this.getCardsForList(list).length, 0));
  completedSubtasks = computed(() => this.lists().flatMap(list => list.cards || []).reduce((total, card) => total + (card.subtasks || []).filter(subtask => subtask.isCompleted).length, 0));
  totalSubtasks = computed(() => this.lists().flatMap(list => list.cards || []).reduce((total, card) => total + (card.subtasks?.length || 0), 0));

  selectedCard = signal<Card | null>(null);
  showCardModal = signal(false);
  showListModal = signal(false);
  activeCardFormListId = signal<number | null>(null);
  editingListId = signal<number | null>(null);
  editingListTitle = signal('');
  showDeleteConfirmModal = signal(false);
  listToDelete = signal<number | null>(null);
  members = signal<User[]>([]);
  showMembersPanel = signal(false);
  inviteEmail = signal('');
  inviteRole = signal<'admin' | 'member' | 'viewer'>('member');
  addingMember = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private websocketService: WebSocketService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.boardId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadBoard();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.websocketService.leaveBoard(Number(this.boardId));
    this.websocketService.disconnect();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadBoard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.boardService.getBoardWithLists(this.boardId).pipe(
      map((response) => response.board || response),
      switchMap((board: Board & { members?: BoardMemberLike[] }) => {
        const lists = [...(board.lists || [])].sort((a, b) => a.position - b.position);
        this.members.set(this.normalizeMembers(board.members || []));

        if (lists.length === 0) {
          return of({ ...board, lists });
        }

        return forkJoin(
          lists.map((list) => this.boardService.getCards(list.id.toString()).pipe(
            map((response) => ({
              ...list,
              cards: this.normalizeCards(response.data || response.cards || [])
            }))
          ))
        ).pipe(map((listsWithCards) => ({ ...board, lists: listsWithCards })));
      })
    ).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading board:', error);
        const message = error?.status === 404
          ? 'Ce tableau est introuvable. Il a peut-etre ete supprime, ou l URL pointe vers un ancien identifiant.'
          : error?.status === 403
            ? 'Vous n avez pas acces a ce tableau.'
            : 'Impossible de charger ce tableau.';
        this.error.set(message);
        this.loading.set(false);
        this.toastService.error('Erreur', message);
      }
    });
  }

  setupWebSocket(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.websocketService.connect(token);
    this.websocketService.joinBoard(Number(this.boardId));

    this.websocketService.on('card-created', (data: any) => this.addLocalCard(this.normalizeCard(data.card), Number(data.listId)));
    this.websocketService.on('card-updated', (data: any) => this.updateLocalCard(this.normalizeCard(data.card)));
    this.websocketService.on('card-deleted', (data: any) => this.removeLocalCard(Number(data.cardId)));
    this.websocketService.on('card-moved', (data: any) => this.moveLocalCardFromSocket(this.normalizeCard(data.card), Number(data.newListId)));
    this.websocketService.on('subtask-created', (data: any) => this.addLocalSubtask(Number(data.cardId), data.subtask));
    this.websocketService.on('subtask-updated', (data: any) => this.updateLocalSubtask(data.subtask));
    this.websocketService.on('subtask-deleted', (data: any) => this.removeLocalSubtask(Number(data.subtaskId)));
    this.websocketService.on('comment-created', (data: any) => this.addLocalComment(Number(data.cardId), data.comment));
    this.websocketService.on('comment-deleted', (data: any) => this.removeLocalComment(Number(data.commentId)));
    this.websocketService.on('list-updated', (data: any) => this.updateLocalList(data.list));
    this.websocketService.on('board-members-updated', (data: any) => this.members.set(this.normalizeMembers(data.members || [])));
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  toggleMembersPanel(): void {
    this.showMembersPanel.set(!this.showMembersPanel());
  }

  closeMembersPanel(): void {
    this.showMembersPanel.set(false);
  }

  addMember(): void {
    const email = this.inviteEmail().trim().toLowerCase();
    if (!email || this.addingMember()) return;

    this.addingMember.set(true);
    this.boardService.addBoardMember(this.boardId, email, this.inviteRole()).subscribe({
      next: (response) => {
        this.members.set(this.normalizeMembers(response.members || []));
        const currentBoard = this.board();
        if (currentBoard) this.board.set({ ...currentBoard, members: this.members() });
        this.inviteEmail.set('');
        this.inviteRole.set('member');
        this.addingMember.set(false);
        this.toastService.success('Succes', 'Membre ajoute au tableau');
      },
      error: (error) => {
        console.error('Error adding member:', error);
        this.addingMember.set(false);
        this.toastService.error('Erreur', error?.error?.message || 'Impossible d ajouter ce membre');
      }
    });
  }

  removeMember(member: User): void {
    if (!member?.id) return;

    this.boardService.removeBoardMember(this.boardId, member.id).subscribe({
      next: (response) => {
        this.members.set(this.normalizeMembers(response.members || []));
        const currentBoard = this.board();
        if (currentBoard) this.board.set({ ...currentBoard, members: this.members() });
        this.toastService.success('Succes', 'Membre retire du tableau');
      },
      error: (error) => {
        console.error('Error removing member:', error);
        this.toastService.error('Erreur', error?.error?.message || 'Impossible de retirer ce membre');
      }
    });
  }

  memberInitials(member: User): string {
    return (member.fullName || member.email || 'U')
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getCardsForList(list: List): Card[] {
    const query = this.searchQuery().trim().toLowerCase();
    const cards = [...(list.cards || [])].sort((a, b) => a.position - b.position);
    if (!query) return cards;

    return cards.filter((card) => {
      const haystack = [
        card.title,
        card.description,
        card.assignee?.fullName,
        ...(card.subtasks || []).map((subtask) => subtask.title),
        ...(card.comments || []).map((comment) => comment.content),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  isListCollapsed(listId: number): boolean {
    return this.collapsedListIds().has(listId);
  }

  toggleListCollapsed(listId: number): void {
    const next = new Set(this.collapsedListIds());
    next.has(listId) ? next.delete(listId) : next.add(listId);
    this.collapsedListIds.set(next);
  }

  onCardDrop(event: CdkDragDrop<Card[]>, targetListId: number): void {
    const card = event.item.data as Card;
    const previousListId = card.listId;
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousListId === targetListId && previousIndex === currentIndex) return;

    this.updateLocalCardPosition(card, targetListId, currentIndex);

    this.boardService.updateCardPosition(card.id.toString(), targetListId.toString(), currentIndex).subscribe({
      next: (response) => this.updateLocalCard(this.normalizeCard(response.data || response.card || response)),
      error: (err) => {
        console.error('Error updating card position:', err);
        this.rollbackCardPosition(card, previousListId, previousIndex);
        this.toastService.error('Erreur', 'Impossible de deplacer la carte');
      }
    });
  }

  updateLocalCardPosition(card: Card, targetListId: number, newPosition: number): void {
    const currentBoard = this.board();
    if (!currentBoard) return;

    const updatedLists = (currentBoard.lists || []).map((list) => {
      const withoutCard = (list.cards || []).filter((currentCard) => currentCard.id !== card.id);
      if (list.id !== targetListId) {
        return { ...list, cards: this.reindexCards(withoutCard) };
      }

      withoutCard.splice(newPosition, 0, { ...card, listId: targetListId, position: newPosition });
      return { ...list, cards: this.reindexCards(withoutCard) };
    });

    this.board.set({ ...currentBoard, lists: updatedLists });
  }

  rollbackCardPosition(card: Card, previousListId: number, previousIndex: number): void {
    this.updateLocalCardPosition(card, previousListId, previousIndex);
  }

  updateLocalCard(updatedCard: Card): void {
    const currentBoard = this.board();
    if (!currentBoard) return;

    const updatedLists = (currentBoard.lists || []).map((list) => ({
      ...list,
      cards: (list.cards || []).map((card) => card.id === updatedCard.id ? { ...card, ...updatedCard } : card)
    }));

    this.board.set({ ...currentBoard, lists: updatedLists });
    this.refreshSelectedCard(updatedCard.id);
  }

  updateLocalList(updatedList: List): void {
    const currentBoard = this.board();
    if (!currentBoard) return;
    const updatedLists = (currentBoard.lists || []).map((list) => list.id === updatedList.id ? { ...list, ...updatedList, cards: list.cards } : list);
    this.board.set({ ...currentBoard, lists: updatedLists });
  }

  addLocalCard(newCard: Card, listId: number): void {
    const currentBoard = this.board();
    if (!currentBoard || !newCard) return;

    const exists = (currentBoard.lists || []).some((list) => (list.cards || []).some((card) => card.id === newCard.id));
    if (exists) return;

    const updatedLists = (currentBoard.lists || []).map((list) => {
      if (list.id !== listId) return list;
      return { ...list, cards: this.reindexCards([...(list.cards || []), { ...newCard, listId }]) };
    });

    this.board.set({ ...currentBoard, lists: updatedLists });
  }

  removeLocalCard(cardId: number): void {
    const currentBoard = this.board();
    if (!currentBoard) return;
    const updatedLists = (currentBoard.lists || []).map((list) => ({ ...list, cards: this.reindexCards((list.cards || []).filter((card) => card.id !== cardId)) }));
    this.board.set({ ...currentBoard, lists: updatedLists });
    if (this.selectedCard()?.id === cardId) this.closeCardModal();
  }

  moveLocalCardFromSocket(card: Card, newListId: number): void {
    if (!card) return;
    this.removeLocalCard(card.id);
    this.addLocalCard({ ...card, listId: newListId }, newListId);
  }

  openCardModal(card: Card): void {
    this.selectedCard.set({ ...card });
    this.showCardModal.set(true);
  }

  openCreateCardModal(listId: number): void {
    this.selectedCard.set({ id: 0, title: '', description: '', position: 0, listId, subtasks: [], comments: [], labels: [] });
    this.showCardModal.set(true);
  }

  closeCardModal(): void {
    this.showCardModal.set(false);
    this.selectedCard.set(null);
  }

  onCardUpdated(card: Card): void {
    const payload = this.cardPayload(card);

    if (card.id === 0) {
      this.boardService.createCard(card.listId.toString(), payload).subscribe({
        next: (response) => {
          this.addLocalCard(this.normalizeCard(response.data || response.card || response), card.listId);
          this.closeCardModal();
          this.toastService.success('Succes', 'Carte creee');
        },
        error: (error) => {
          console.error('Error creating card:', error);
          this.toastService.error('Erreur', 'Impossible de creer la carte');
        }
      });
      return;
    }

    this.boardService.updateCard(card.id.toString(), payload).subscribe({
      next: (response) => {
        this.updateLocalCard(this.normalizeCard(response.data || response.card || response));
        this.closeCardModal();
        this.toastService.success('Succes', 'Carte mise a jour');
      },
      error: (error) => {
        console.error('Error updating card:', error);
        this.toastService.error('Erreur', 'Impossible de mettre a jour la carte');
      }
    });
  }

  deleteSelectedCard(): void {
    const card = this.selectedCard();
    if (!card || card.id === 0) return;

    this.boardService.deleteCard(card.id.toString()).subscribe({
      next: () => {
        this.removeLocalCard(card.id);
        this.toastService.success('Succes', 'Carte supprimee');
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        this.toastService.error('Erreur', 'Impossible de supprimer la carte');
      }
    });
  }

  onSubtaskCreated(event: { cardId: number; title: string }): void {
    this.boardService.createSubtask(event.cardId, event.title).subscribe({
      next: (response) => this.addLocalSubtask(event.cardId, response.data || response.subtask || response),
      error: (error) => {
        console.error('Error creating subtask:', error);
        this.toastService.error('Erreur', 'Impossible de creer la sous-tache');
      }
    });
  }

  onSubtaskUpdated(subtask: Subtask): void {
    this.boardService.updateSubtask(subtask.id, { title: subtask.title, isCompleted: subtask.isCompleted }).subscribe({
      next: (response) => this.updateLocalSubtask(response.data || response.subtask || response),
      error: (error) => {
        console.error('Error updating subtask:', error);
        this.toastService.error('Erreur', 'Impossible de mettre a jour la sous-tache');
      }
    });
  }

  onSubtaskDeleted(subtaskId: number): void {
    this.boardService.deleteSubtask(subtaskId).subscribe({
      next: () => this.removeLocalSubtask(subtaskId),
      error: (error) => {
        console.error('Error deleting subtask:', error);
        this.toastService.error('Erreur', 'Impossible de supprimer la sous-tache');
      }
    });
  }

  onCommentCreated(event: { cardId: number; content: string }): void {
    this.boardService.createComment(event.cardId, event.content).subscribe({
      next: (response) => this.addLocalComment(event.cardId, response.data || response.comment || response),
      error: (error) => {
        console.error('Error creating comment:', error);
        this.toastService.error('Erreur', 'Impossible de creer le commentaire');
      }
    });
  }

  onCommentDeleted(commentId: number): void {
    this.boardService.deleteComment(commentId).subscribe({
      next: () => this.removeLocalComment(commentId),
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.toastService.error('Erreur', 'Impossible de supprimer le commentaire');
      }
    });
  }

  openCreateListModal(): void {
    this.showListModal.set(true);
  }

  closeListModal(): void {
    this.showListModal.set(false);
  }

  onListCreated(title: string): void {
    this.boardService.createList(this.boardId, title).subscribe({
      next: (response) => {
        const currentBoard = this.board();
        if (currentBoard) {
          this.board.set({ ...currentBoard, lists: [...(currentBoard.lists || []), { ...response.list, cards: [] }] });
        }
        this.closeListModal();
        this.toastService.success('Succes', 'Liste creee');
      },
      error: (error) => {
        console.error('Error creating list:', error);
        this.toastService.error('Erreur', 'Impossible de creer la liste');
      }
    });
  }

  openCardForm(listId: number): void {
    this.activeCardFormListId.set(listId);
  }

  closeCardForm(): void {
    this.activeCardFormListId.set(null);
  }

  onCardCreated(data: { listId: number; title: string }): void {
    const newCard: Card = { id: 0, title: data.title, description: '', position: 0, listId: data.listId, subtasks: [], comments: [], labels: [] };

    this.boardService.createCard(data.listId.toString(), this.cardPayload(newCard)).subscribe({
      next: (response) => {
        this.addLocalCard(this.normalizeCard(response.data || response.card || response), data.listId);
        this.closeCardForm();
        this.toastService.success('Succes', 'Carte creee');
      },
      error: (error) => {
        console.error('Error creating card:', error);
        this.toastService.error('Erreur', 'Impossible de creer la carte');
      }
    });
  }

  startEditList(listId: number, currentTitle: string): void {
    this.editingListId.set(listId);
    this.editingListTitle.set(currentTitle);
  }

  cancelEditList(): void {
    this.editingListId.set(null);
    this.editingListTitle.set('');
  }

  saveListTitle(listId: number): void {
    const title = this.editingListTitle().trim();
    if (!title) return;

    this.boardService.updateList(listId.toString(), { title }).subscribe({
      next: (response) => {
        this.updateLocalList(response.list);
        this.cancelEditList();
        this.toastService.success('Succes', 'Liste mise a jour');
      },
      error: (error) => {
        console.error('Error updating list:', error);
        this.toastService.error('Erreur', 'Impossible de mettre a jour la liste');
      }
    });
  }

  deleteList(listId: number): void {
    this.listToDelete.set(listId);
    this.showDeleteConfirmModal.set(true);
  }

  confirmDeleteList(): void {
    const listId = this.listToDelete();
    if (!listId) return;

    this.boardService.deleteList(listId.toString()).subscribe({
      next: () => {
        const currentBoard = this.board();
        if (currentBoard) {
          this.board.set({ ...currentBoard, lists: (currentBoard.lists || []).filter((list) => list.id !== listId) });
        }
        this.showDeleteConfirmModal.set(false);
        this.listToDelete.set(null);
        this.toastService.success('Succes', 'Liste supprimee');
      },
      error: (error) => {
        console.error('Error deleting list:', error);
        this.showDeleteConfirmModal.set(false);
        this.listToDelete.set(null);
        this.toastService.error('Erreur', 'Impossible de supprimer la liste');
      }
    });
  }

  cancelDeleteList(): void {
    this.showDeleteConfirmModal.set(false);
    this.listToDelete.set(null);
  }

  getSubtaskProgress(card: Card): number {
    const subtasks = card.subtasks || [];
    if (subtasks.length === 0) return 0;
    return Math.round((subtasks.filter((subtask) => subtask.isCompleted).length / subtasks.length) * 100);
  }

  getLabelColor(label: any): string {
    return typeof label === 'string' ? label : label?.color || 'var(--accent)';
  }

  getDueDateState(card: Card): 'none' | 'soon' | 'overdue' | 'done' {
    if (!card.dueDate) return 'none';
    if ((card.subtasks || []).length > 0 && this.getSubtaskProgress(card) === 100) return 'done';
    const due = new Date(card.dueDate).getTime();
    const now = Date.now();
    if (due < now) return 'overdue';
    if (due - now < 1000 * 60 * 60 * 24 * 2) return 'soon';
    return 'none';
  }

  private normalizeCards(cards: Card[]): Card[] {
    return cards.map((card) => this.normalizeCard(card)).sort((a, b) => a.position - b.position);
  }

  private normalizeCard(card: any): Card {
    return {
      ...card,
      labels: card?.labels || [],
      subtasks: card?.subtasks || [],
      comments: card?.comments || [],
    };
  }

  private normalizeMembers(members: BoardMemberLike[]): User[] {
    return members.map((member) => ({
      id: member.id || member.userId || 0,
      fullName: member.fullName || `Membre ${member.userId || ''}`.trim(),
      email: member.email || '',
      avatarUrl: member.avatarUrl,
      role: member.role || 'member',
    })).filter((member) => member.id !== 0 || member.fullName);
  }

  private cardPayload(card: Card): any {
    return {
      title: card.title,
      description: card.description || null,
      listId: card.listId,
      dueDate: card.dueDate || null,
      assigneeId: card.assigneeId || null,
    };
  }

  private reindexCards(cards: Card[]): Card[] {
    return cards.map((card, index) => ({ ...card, position: index }));
  }

  private addLocalSubtask(cardId: number, subtask: Subtask): void {
    this.patchCard(cardId, (card) => {
      const exists = (card.subtasks || []).some((item) => item.id === subtask.id);
      if (exists) return card;
      return { ...card, subtasks: [...(card.subtasks || []), subtask] };
    });
  }

  private updateLocalSubtask(subtask: Subtask): void {
    this.patchCards((card) => ({
      ...card,
      subtasks: (card.subtasks || []).map((item) => item.id === subtask.id ? subtask : item)
    }));
  }

  private removeLocalSubtask(subtaskId: number): void {
    this.patchCards((card) => ({ ...card, subtasks: (card.subtasks || []).filter((subtask) => subtask.id !== subtaskId) }));
  }

  private addLocalComment(cardId: number, comment: Comment): void {
    this.patchCard(cardId, (card) => {
      const exists = (card.comments || []).some((item) => item.id === comment.id);
      if (exists) return card;
      return { ...card, comments: [...(card.comments || []), comment] };
    });
  }

  private removeLocalComment(commentId: number): void {
    this.patchCards((card) => ({ ...card, comments: (card.comments || []).filter((comment) => comment.id !== commentId) }));
  }

  private patchCard(cardId: number, patch: (card: Card) => Card): void {
    this.patchCards((card) => card.id === cardId ? patch(card) : card);
  }

  private patchCards(patch: (card: Card) => Card): void {
    const currentBoard = this.board();
    if (!currentBoard) return;
    const updatedLists = (currentBoard.lists || []).map((list) => ({ ...list, cards: (list.cards || []).map(patch) }));
    this.board.set({ ...currentBoard, lists: updatedLists });
    const selected = this.selectedCard();
    if (selected) this.refreshSelectedCard(selected.id);
  }

  private refreshSelectedCard(cardId: number): void {
    const found = this.lists().flatMap((list) => list.cards || []).find((card) => card.id === cardId);
    if (found) this.selectedCard.set({ ...found });
  }
}
