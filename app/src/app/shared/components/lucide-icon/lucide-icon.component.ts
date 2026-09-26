import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import type { IconNode } from 'lucide';
import { icons } from 'lucide';

// for names icons see the reference
// @Reference: https://lucide.dev/icons/

@Component({
  selector: 'lu-icon',
  templateUrl: './lucide-icon.html',
  styleUrls: ['./lucide-icon.scss']
})
export class LucideIconComponent implements OnChanges {
  // Preferred: pass the icon data directly, e.g. [icon]="Menu" (tree-shakeable)
  @Input() icon?: IconNode | null;
  // Convenient: lookup by name from the full registry, e.g. name="Menu"
  // NOTE: using `name` pulls in the whole lucide registry (all icons).
  @Input() name?: string;
  @Input() size = 24;
  @Input() color = 'currentColor';
  @Input() strokeWidth = 2;
  @Input() absoluteStrokeWidth = false;
  @Input() strokeLinecap: 'round' | 'butt' | 'square' = 'round';
  @Input() strokeLinejoin: 'round' | 'miter' | 'bevel' = 'round';
  @Input() className = '';

  nodes: [string, any][] = [];
  viewBox = '0 0 24 24';

  get strokeWidthValue(): number {
    return this.absoluteStrokeWidth ? (this.strokeWidth * 24) / this.size : this.strokeWidth;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['icon'] || changes['name']) {
      this.resolve();
    }
  }

  private resolve() {
    let data: IconNode | undefined;
    if (this.icon) {
      data = this.icon;
    } else if (this.name) {
      data = (icons as Record<string, IconNode>)[this.name];
    }
    this.nodes = (data ?? []) as [string, any][];
  }
}
