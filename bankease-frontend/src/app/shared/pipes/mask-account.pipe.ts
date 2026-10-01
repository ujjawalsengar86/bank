import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskAccount',
  standalone: true
})
export class MaskAccountPipe implements PipeTransform {
  transform(value: string | null | undefined, visibleDigits: number = 4): string {
    if (!value) return '';
    const str = value.toString().trim();
    if (str.length <= visibleDigits) return str;

    const visiblePart = str.slice(-visibleDigits);
    const maskedLength = str.length - visibleDigits;
    const maskedPart = '•'.repeat(Math.min(maskedLength, 8));

    return `${maskedPart} ${visiblePart}`;
  }
}
