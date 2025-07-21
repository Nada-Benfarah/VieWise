import { Component } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationService } from '../../services/invitation/invitation.service';
import { PlanService } from '../../services/plan/plan.service';

interface Invitation {
  email: string;
  project: string;
  role: 'Éditeur' | 'Visiteur';
  status: 'En cours' | 'Accepté' | 'Rejeté';
}

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
  imports: [NgClass, NgForOf, FormsModule, NgIf],
  standalone: true
})
export class InviteComponent {
  emailInput = '';
  selectedRole = 'Éditeur';
  availableProjects: { id: number; name: string; type: 'agent' | 'workflow' }[] = [];
  selectedProjects: number[] = [];
  invitations:any;
  remainingInvitations: number = 0;
  totalInvitations = 0;
  usedInvitations = 0;
  userPlanName: string | undefined;
  constructor(private invitationService: InvitationService,private planService: PlanService) {}

  ngOnInit() {
    this.planService.getCurrentUserPlan().subscribe({
      next: (data) => {
        this.userPlanName = data.name;
      },
      error: (err) => {
        console.error('Erreur chargement plan utilisateur', err);
      }
    });
    this.invitationService.getAllProjects().subscribe((projects) => {
      this.availableProjects = projects;
    });
    this.invitationService.getRemainingInvitations().subscribe(data => {
      this.remainingInvitations = data.remaining;
      this.totalInvitations = data.total;
      this.usedInvitations = data.used;
    });


    this.invitationService.getSentInvitations().subscribe(data => {
      console.log('hhhhhh',data)


      this.invitations = data.map(inv => ({
        id: inv.id,
        email: inv.receiver_email,
        agents: inv.selected_agents || [],
        workflows: inv.selected_workflows || [],
        role: inv.role,
        status: inv.status
      }));
    });



  }


  sendInvitations() {
    if (this.remainingInvitations <= 0) {
      alert("Vous avez atteint la limite d'invitations autorisées.");
      return;
    }

    const emails = this.emailInput.split(',').map(e => e.trim()).filter(e => e);
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    const selected_agents = this.agentProjects
      .filter(p => this.selectedProjects.includes(p.id))
      .map(p => p.id);

    const selected_workflows = this.userPlanName === 'BUSINESS'
      ? this.workflowProjects.filter(p => this.selectedProjects.includes(p.id)).map(p => p.id)
      : [];

    let invitationsSent = 0;

    emails.forEach(email => {
      const payload = {
        receiver_email: email,
        selected_agents,
        selected_workflows,
        role: this.selectedRole,
        expiration_date: expiration.toISOString()
      };
      this.invitationService.sendInvitations(payload).subscribe((createdInvitation: any) => {
        const agentNames = this.agentProjects
          .filter(p => selected_agents.includes(p.id))
          .map(p => p.name);

        const workflowNames = this.workflowProjects
          .filter(p => selected_workflows.includes(p.id))
          .map(p => p.name);

        this.invitations.unshift({
          id: createdInvitation.id,
          email: createdInvitation.receiver_email,
          agents: agentNames,
          workflows: workflowNames,
          role: createdInvitation.role,
          status: createdInvitation.status
        });

        this.invitations.sort((a, b) => b.id - a.id);

        invitationsSent++;

        // Mettre à jour les stats une seule fois à la fin
        if (invitationsSent === emails.length) {
          this.invitationService.getRemainingInvitations().subscribe(data => {
            this.remainingInvitations = data.remaining;
            this.usedInvitations = data.used;
            this.totalInvitations = data.total;
          });
        }
      });
    });

    this.emailInput = '';
    this.selectedProjects = [];
  }




  changeStatus(index: number, status: 'Accepté' | 'Rejeté') {
    const invitationId = this.invitations[index].id;
    this.invitationService.updateStatus(invitationId, status).subscribe(() => {
      this.invitations[index].status = status;

      this.invitationService.getRemainingInvitations().subscribe(data => {
        this.remainingInvitations = data.remaining;
      });
    });
  }

  toggleProjectSelection(projectId: number): void {
    const index = this.selectedProjects.indexOf(projectId);
    if (index > -1) {
      this.selectedProjects.splice(index, 1);
    } else {
      this.selectedProjects.push(projectId);
    }
  }

  get agentProjects() {
    return this.availableProjects.filter(p => p.type === 'agent');
  }

  get workflowProjects() {
    return this.availableProjects.filter(p => p.type === 'workflow');
  }
  deleteInvitation(index: number): void {
    const invitationId = this.invitations[index].id;
    this.invitationService.deleteInvitation(invitationId).subscribe({
      next: () => {
        this.invitations.splice(index, 1);
        this.invitationService.getRemainingInvitations().subscribe(data => {
          this.remainingInvitations = data.remaining;
          this.usedInvitations = data.used;
          this.totalInvitations = data.total;
        });
      },
      error: err => {
        alert("Erreur lors de la suppression de l'invitation.");
        console.error(err);
      }
    });
  }

}
