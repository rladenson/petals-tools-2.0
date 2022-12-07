import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { PKGroup } from "../pk-models";
import { LocalService } from "../local.service";
import { InternalService } from "../internal.service";
import { MatDialog } from "@angular/material/dialog";
import { PrettyGroupPrettifierComponent } from "../pretty-group-prettifier/pretty-group-prettifier.component";
import {PluralKitService} from "../pluralkit.service";

@Component({
  selector: 'app-pretty-groups',
  templateUrl: './pretty-groups.component.html',
  styleUrls: ['./pretty-groups.component.css']
})
export class PrettyGroupsComponent implements OnInit {
  myriadDisable: boolean = false;
  token: string = "";
  inUseArr: PKGroup[] = [];
  notInUseArr: PKGroup[] = [];
  inUse: any;
  notInUse: any;
  currentlySelected?: any;
  advancedToggle: boolean = false;
  systemName: string | null = null;

  constructor(private localService: LocalService, private internalService: InternalService,
              public dialog: MatDialog, private pluralKitService: PluralKitService) {

    this.internalService.groups$.subscribe(res => {
      this.notInUseArr = res;
      this.inUseArr = [];
      this.notInUseArr.forEach((_, i, arr) => {
        arr[i].indents = 0;
      })
    });

  }

  ngOnInit(): void {
    this.myriadDisable = this.localService.get("myriadDisable") === "true";
    this.token = this.localService.get('token');
    this.internalService.updateGroups();
    this.pluralKitService.getSystem().then(s => this.systemName = s.name);
  }

  drop(event: CdkDragDrop<PKGroup[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
      );
    }

    if(event.container.id === "cdk-drop-list-0") {
      this.notInUseSelected(event.container.data[event.currentIndex]);
    } else {
      this.inUseSelected(event.container.data[event.currentIndex]);
    }
  }

  saveToken() {
    this.localService.set('token', this.token);
    this.internalService.updateGroups();
    this.pluralKitService.getSystem().then(s => this.systemName = s.name);
  }


  notInUseSelected(selected?: PKGroup) {
    this.inUse = null;

    if(selected) {
      this.notInUse = new Array(selected);
    }

    switch (this.notInUse.length) {
      case 0:
        this.currentlySelected = undefined;
        break;
      case 1:
        this.currentlySelected = this.notInUse[0];
        break;
      default:
        this.currentlySelected = this.notInUse[1];
        this.notInUse = new Array(this.notInUse[1]);
        break;
    }

  }

  inUseSelected(selected?: PKGroup) {
    this.notInUse = null;

    if(selected) {
      this.inUse = new Array(selected);
    }

    switch (this.inUse.length) {
      case 0:
        this.currentlySelected = undefined;
        break;
      case 1:
        this.currentlySelected = this.inUse[0];
        break;
      default:
        this.currentlySelected = this.inUse[1];
        this.inUse = new Array(this.inUse[1]);
        break;
    }
  }

  incrementIndents() {
    this.currentlySelected.indents++;
  }

  decrementIndents() {
    this.currentlySelected.indents--;
  }

  moveAllToNotInUse() {
    this.notInUse = null;
    this.inUse = null;

    this.notInUseArr = [...this.notInUseArr, ...this.inUseArr];
    this.inUseArr = [];
  }

  moveAllToInUse() {
    this.notInUse = null;
    this.inUse = null;

    this.inUseArr = [...this.inUseArr, ...this.notInUseArr];
    this.notInUseArr = [];
  }

  parse() {
    let maxIndent = this.checkIfValid();
    if(maxIndent === -1) {
      console.log("ERROR"); //TODO
      return;
    }
    let sort = Array.from({length: maxIndent + 1}, _ => 0);


    this.inUseArr.forEach((group, i, arr) => {
      group.sortOrder = Array.from({length: group.indents! + 1}, _ => 0);
      group.sortOrder.forEach((tierValue, tier, sortOrder) => {
        sortOrder[tier] = sort[tier];
      })
      if(arr.length > i + 1) {
        if(arr[i+1].indents === group.indents) {
          sort[group.indents!] = sort[group.indents!] + 1;
        } else if(arr[i+1].indents! < group.indents!) {
          sort.forEach((m, n, sortinner) => {
            if(n > arr[i+1].indents!) {
              sortinner[n] = 0;
            } else if(n === arr[i+1].indents) {
              sortinner[n] = m + 1;
            }
          })
        } else if(arr[i+1].indents! > group.indents!) {
          //nothing?
        }
      }
    })

    this.openDialog();

  }

  checkIfValid() {
    let maxIndent = -1;
    let good = true;
    this.inUseArr.forEach(group => {
      if(group.indents! > maxIndent + 1) {
        good = false;
        return;
      } else if(group.indents! > maxIndent) {
        maxIndent = group.indents!;
      }
    })
    return good ? maxIndent : -1;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(PrettyGroupPrettifierComponent, {
      width: '100%',
      data: this.inUseArr
    });

    dialogRef.afterClosed().subscribe(settings => {
      console.log('The dialog was closed');
      this.makeExport(settings);
    });
  }

  flattenIndents(maxIndents: number) {
    this.inUseArr.forEach((g, i, arr) => {
      if(g.indents! > maxIndents) {
        arr[i].indents = maxIndents;
      }
    })
    this.notInUseArr.forEach((g, i, arr) => {
      if(g.indents! > maxIndents) {
        arr[i].indents = maxIndents;
      }
    })
  }

  makeExport(settings: any) {
    let arr: PKGroup[] = JSON.parse(JSON.stringify(this.inUseArr))
    let prevIndent = 1;
    let unicode = [',', ';', ':', '!', '?', '.', "'", '"', '(', ')', '[', ']', '{', '}', '@', '/', '&', '#', '%', '^', '<', '=', '>', '~']
    let unicodeIndex = -1;
    arr.forEach((g: PKGroup, i, arr) => { //TODO GENERALIZE FOR MORE INDENT AMOUNTS
      let newDN = '';
      let newName = '';
      if(g.indents === 0) {
        if(prevIndent === 1) {
          newDN = newDN.concat('\n')
        }
        unicodeIndex++;
        newName = newName.concat(unicode[unicodeIndex], unicode[unicodeIndex], g.name);
        newDN = newDN.concat(settings.categoryPrefix, g.display_name ? g.display_name : g.name, settings.categorySuffix, '\n> ');
      } else if(g.indents === 1) {
        newName = newName.concat(unicode[unicodeIndex], g.name);
        newDN = newDN.concat(settings.groupPrefix, g.display_name ? g.display_name : g.name, settings.groupSuffix);
      }
      prevIndent = g.indents!;
      arr[i] = new PKGroup(g.id, newName, newDN, [], undefined);
    })
    let str = JSON.stringify(arr);

    let download = new File(['{"version": 2, "switches": [], "members": [], "groups": ', str, ', ' +
        '"name": ', this.systemName ? '"' + this.systemName + '"' : 'null', '}'],
        'groupImport.json', {type: 'text/json'});
    let link = document.createElement('a');
    let url = URL.createObjectURL(download);
    link.href = url;
    link.download = download.name;
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  }
}

/*
TODO what happens if too many groups?
TODO make it recognize when you've used the tool before
TODO should turning advancedtoggle off get rid of all extra indents? maybe just visually?
TODO ask if they want to make all names on newlines
 */
