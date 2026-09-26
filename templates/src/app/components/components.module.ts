import { NgModule } from '@angular/core';
import { FileListComponent } from './file-list/file-list.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    FileListComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FileListComponent
  ]
})
export class ComponentsModule { }
