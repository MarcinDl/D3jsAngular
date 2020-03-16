import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from '@angular/core';
import { ECG } from '../../ecg';
import * as d3 from 'd3';

@Component({
  selector: 'app-ecg-chart',
  templateUrl: './ecg-chart.component.html',
  styleUrls: ['./ecg-chart.component.scss']
})
export class EcgChartComponent implements OnInit {

  @ViewChild('svgContainer', { static: true })
    svgContainer: ElementRef;

    MAX_X = 12;
    MAX_Y = 5;
    MIN_Y = -3;
    MASK_WIDTH = 0.5;
    MASK_STEP_SIZE = 0.1;
    MASK_TRANSITION_DURATION = 50;

   svg: any;
   width: any;
   height: any;
   g: any;
   ecg: ECG = new ECG();
   data: any[] = [];

   x: any;
   y: any;
   line: any;
   clip_path: any;
   clip_rect_1: any;
   clip_rect_2: any;
   path: any;

  constructor(viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    const svgId = `svg${Math.floor(Math.random() * (10000 - 1)) + 1}`;
    this.svgContainer.nativeElement.innerHTML = `<svg id="${svgId}" width="900" height="300"></svg>`;
    this.svg = d3.select(`#${svgId}`);
    this.width = +this.svg.attr('width');
    this.height = +this.svg.attr('height');

    this.g = this.svg.append('g');

    this.x = d3.scaleLinear()
                    .domain([0, this.MAX_X])
                    .range([0, this.width]);

    this.y = d3.scaleLinear()
                    .domain([this.MIN_Y, this.MAX_Y])
                    .range([this.height, 0]);

    this.line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d, i) { return this.x(d.getX()); }.bind(this))
    .y(function(d, i) { return this.y(d.getY()); }.bind(this));

    this.clip_path = this.g.append('defs')
                            .append('defs')
                            .append('clipPath')
                            .attr('id', 'clip');

    this.clip_rect_1 = this.clip_path
                            .append('rect')
                            .attr('width', 0)
                            .attr('height', this.height);

    this.clip_rect_2 = this.g.append('g')
                              .attr('clip-path', 'url(#clip)')
                              .append('path')
                              .datum(this.data)
                              .attr('class', 'line')
                              .attr('d', this.line);

    this.path = this.g.append('g')
                      .attr('clip-path', 'url(#clip)')
                      .append('path')
                      .datum(this.data)
                      .attr('class', 'line')
                      .attr('d', this.line);

    this.tick();
  }

  tick() {
    // Move the clip masks
    let delta_x = this.x(this.MASK_STEP_SIZE);
    let left_rect = this.clip_rect_1;
    let right_rect = this.clip_rect_2;
    if (+left_rect.attr('x') > +right_rect.attr('x') ||
        +left_rect.attr('x') + +left_rect.attr('width') > +right_rect.attr('x') + +right_rect.attr('width')) {
        left_rect = this.clip_rect_2;
        right_rect = this.clip_rect_1;
    }
    let next_left_x = +left_rect.attr('x');
    let next_left_width = +left_rect.attr('width');
    let next_right_x = +right_rect.attr('x');
    let next_right_width = +right_rect.attr('width');

    // Case 1: We have a single mask while the gap moves from the right edge
    // to the left edge.
    //
    // |XXXXXXXX | => | XXXXXXXX|
    //
    // Left mask remains unchanged, right masks translates to the right.
    if (+right_rect.attr('x') >= this.x(this.MAX_X) ||
        +right_rect.attr('x') + +right_rect.attr('width') < this.x(this.MAX_X)) {
        if (+right_rect.attr('x') >= this.x(this.MAX_X)) {
            let temp_rect = left_rect;
            left_rect = right_rect;
            right_rect = temp_rect;

            next_left_x = 0;
            next_left_width = 0;
            next_right_width = +right_rect.attr('width');

            left_rect
                .attr('x', 0)
                .attr('width', 0)
                .attr('transform', null);
        }

        next_right_x = +right_rect.attr('x') + this.x(this.MASK_STEP_SIZE);
    } else {
        next_left_width += this.x(this.MASK_STEP_SIZE);
        next_right_x += this.x(this.MASK_STEP_SIZE);
        next_right_width -= this.x(this.MASK_STEP_SIZE);
    }

    let t = left_rect.transition()
        .attr('x', next_left_x)
        .attr('width', next_left_width)
        .duration(this.MASK_TRANSITION_DURATION)
        .ease(d3.easeLinear);

    right_rect.transition(t)
        .attr('x', next_right_x)
        .attr('width', next_right_width)
        .duration(this.MASK_TRANSITION_DURATION)
        .ease(d3.easeLinear)
        .on('end', this.tick.bind(this));

    // update the data
    let update_datum = (new_x, new_y) => {
        if (new_x % this.MAX_X / this.ecg.getStepSize() >= this.data.length) {
          this.data.push(new Point(new_x, new_y));
        }
        else {
          this.data[new_x / this.ecg.getStepSize()] = new Point(new_x, new_y);
        }
    };

    let new_datum = this.ecg.tick();
    let new_x = new_datum[0];
    let new_y = new_datum[1];

    while (new_x % this.MAX_X < (this.x.invert(next_right_x) - this.MASK_WIDTH / 2.0) % this.MAX_X) {
        update_datum(new_x, new_y);

        new_datum = this.ecg.tick();
        new_x = new_datum[0];
        new_y = new_datum[1];
    }
    update_datum(new_x, new_y);

    this.path
        .transition()
        .selection()
        .interrupt()
        .attr('d', this.line)
        .attr('transform', null);
}

  // A Simple Point in Euclidean Space
}

class Point {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getX() { return this.x; }
  getY() { return this.y; }
}
