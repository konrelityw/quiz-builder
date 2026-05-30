import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';

interface Product {
  title: string;
  description: string;
  image: string;
  price: string;
  link: string;
}

@Component({
  selector: 'app-store-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './store-home-page.component.html',
  styleUrls: ['./store-home-page.component.scss'],
})
export class StoreHomeComponent {
  products: Product[] = [
    {
      title: 'Hydra Calm Cream',
      description: 'Глибоке зволоження для сухої та чутливої шкіри.',
      image:
        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200&auto=format&fit=crop',
      price: '$34.99',
      link: '/products/hydra-calm-cream',
    },
    {
      title: 'Pure Balance Gel',
      description: 'Легкий гель для жирної та комбінованої шкіри.',
      image:
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop',
      price: '$29.99',
      link: '/products/pure-balance-gel',
    },
    {
      title: 'Glow Repair Cream',
      description: 'Крем з вітаміном C для тьмяної та втомленої шкіри.',
      image:
        'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1200&auto=format&fit=crop',
      price: '$36.99',
      link: '/products/glow-repair-cream',
    },
    {
      title: 'Age Restore Complex',
      description: 'Антивіковий догляд для зрілої шкіри.',
      image:
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
      price: '$42.99',
      link: '/products/age-restore-complex',
    },
  ];
}
