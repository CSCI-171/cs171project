class AreaChart {

    constructor(_parentElement, _data, selected_column, _colors, _chartTitle, _tooltipText) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.colors = _colors;
        this.chartTitle = _chartTitle;
        this.selected_column = selected_column;
        this.tooltipText = _tooltipText;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 15, right: 25, bottom: 25, left: 50 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        console.log("_parentElement: ", vis.parentElement)
        console.log("document width: ", document.getElementById(vis.parentElement).getBoundingClientRect().width)
            vis.height = 190 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .ticks(5);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(value => d3.format(".0%")(value / 100)) // because we're using percentages
            .ticks(6);

        // Set domains by finding the min and max of both the X and Y
        let minMaxX = d3.extent(vis.data.map(function (d) { return d.date; }));
        vis.x.domain(minMaxX);

        let minMaxY = [d3.min(vis.data.map(function (d) { return d[vis.selected_column]; })),
            d3.max(vis.data.map(function (d) { return d[vis.selected_column]; }))];
        vis.y.domain(minMaxY);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Append title for the chart at the top
        vis.title = vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .style("font-size", ".7em")
            .style("font-weight", "bold")
            .attr("fill", "currentColor")
            .text(vis.chartTitle);

        // Define a tooltip div
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // // Add (?) symbol for the tooltip
        vis.title.append("tspan")
            .attr("class", "tooltip-trigger")
            .style("cursor", "pointer")
            .text(" ⓘ")
            .on("mouseover", function (event) {
                tooltip.transition().style("opacity", 1);

                // Create a speech bubble with a white background
                tooltip.html('<div class="speech-bubble">' + vis.tooltipText + '</div>')
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().style("opacity", 0);
            });

        // Append a path for the area function, so that it is later behind the brush overlay
        vis.ratePath = vis.svg.append("path")
            .attr("class", "area");

        // Define the D3 path generator
        vis.area = d3.area()
            .x(function (d) { return vis.x(d.date); })
            .y0(vis.height)
            .y1(function (d) { return vis.y(d[vis.selected_column]); });

        vis.area.curve(d3.curveCardinal);

        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // TODO fix up the axes titles...
        // // Axis titles
        // vis.svg.append("text")
        //     .attr("x", -50)
        //     .attr("y", -8)
        //     .text("Votes");
        // vis.svg.append("text")
        //     .attr("x", vis.width - 10)
        //     .attr("y", vis.height + 25)
        //     .text("Age");

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }



    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        this.displayData = this.data;

        // Create a new dataset with only date and mortgage rates
        // vis.displayData = vis.data.map(function (d) {
        //     return {
        //         date: d.date,
        //         mortgage_rates: d.mortgage_rates
        //     }
        // });



        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     * Function parameters only needed if different kinds of updates are needed
     */

    updateVis() {
        let vis = this;

        // vis.x.domain(d3.extent(vis.preProcessedData, function (d) {
        //     return d.date
        // }));
        // vis.y.domain(d3.extent(vis.preProcessedData, function (d) {
        //     return d.newCases
        // }));

        // Update domains
        // vis.y.domain(d3.extent(vis.displayData));
        // Issue with above code is that it doesn't know what column to use (in this case, mortgage rates)
        vis.x.domain(d3.extent(vis.displayData, function (d) {
            return d.date
        }));
        vis.y.domain(d3.extent(vis.displayData, function (d) {
            return d[vis.selected_column]
        }));

        // Call the area function and update the path
        // D3 uses each data point and passes it to the area function.
        // The area function translates the data into positions on the path in the SVG.
        vis.ratePath
            .datum(vis.displayData)
            // .data([vis.displayData])
            .transition()
            .duration(800)
            .attr("d", vis.area);

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    onSelectionChange(selectionStart, selectionEnd) {
        let vis = this;

        // Filter original unfiltered data depending on selected time period (brush)
        vis.filteredData = vis.data.filter(function (d) {
            return d.date >= selectionStart && d.date <= selectionEnd;
        });

        vis.displayData = vis.filteredData
        vis.updateVis();
    }
}
