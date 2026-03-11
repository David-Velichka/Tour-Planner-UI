import { Component, input } from '@angular/core';

@Component({
  selector: 'app-attribute-field',
  imports: [],
  templateUrl: './attribute-field.html',
  styleUrl: './attribute-field.css',
})
export class AttributeField {
  readonly label = input<string>(''); 
  readonly value = input<string | number>('');
}
