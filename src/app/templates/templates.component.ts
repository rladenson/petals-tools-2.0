import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LocalService } from "../local.service";

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent implements OnInit {

  @Input() templates: [string, string][] = [];
  @Output() templatesChange = new EventEmitter<[string, string][]>();


  constructor(private localService: LocalService) { }

  ngOnInit(): void {

  }

  newTemplate(): void {
    this.templates.push(['', '']);
    this.saveTemplates();
  }

  saveTemplates(): void {
    this.templatesChange.emit(this.templates);
    this.localService.set('templates', JSON.stringify(this.templates));
  }

  removeTemplate(index: number): void {
    this.templates.splice(index, 1);
    this.saveTemplates();
  }

}
