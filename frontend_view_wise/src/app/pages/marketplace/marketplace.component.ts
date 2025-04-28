import { Component, OnInit } from '@angular/core';
import { MarketplaceAgent, MarketplaceService } from '../../services/marketplace/marketplace.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit {

  agents: MarketplaceAgent[] = [];
  filteredAgents: MarketplaceAgent[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'Tous';

  constructor(private marketplaceService: MarketplaceService) {}

  ngOnInit(): void {
    this.marketplaceService.getMarketplaceAgents().subscribe((agents) => {
      this.agents = agents;
      this.filteredAgents = agents;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredAgents = this.agents.filter(market => {
      const matchesCategory = this.selectedCategory === 'Tous' || market.category === this.selectedCategory;
      const matchesSearch = market.agent.agentName.toLowerCase().includes(this.searchTerm.toLowerCase()) || market.agent.agentObjective.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }
}
