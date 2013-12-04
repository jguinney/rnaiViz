
/*var viz = {width:500, height: 500, 
	margin: {top: 10, right: 10, bottom: 20, left: 10}};
*/

var opacity=.6;

function powerOfTen(d) {
  return d / Math.pow(10, Math.ceil(Math.log(d) / Math.LN10 - 1e-12)) === 1;
}

function key(d){ return d.id; }
function x(d){ return xscale(d.UntreatedMean);}
function y(d){ return yscale(d.TreatedMean);}
function r(d){ return 1.5;}
function col(d){ 
	var inRegion = isInHitRegion(d);
	sig = d.pValue < .01
	if(d.Gene == "EMPTY"){
		return "blue";
	}else if(d.Gene == "Control"){
		return "purple";
	}else if(inRegion && sig){
		return "red";	
	}else if(inRegion){
		return "orange";
	}else if(sig){
		return "green";
	}else{
		return "gray";
	}
	//d3.scale.category20b()[1]; 
}
function order(a,b){ r(b) - r(a);}
var xscale;
var yscale;

//function orderCircles(a,b){ return b.freq - a.freq; }

var currentHighlight;

function highlightGene(d){
	if(currentHighlight){
		currentHighlight.attr("r", function(d){ 
		   	 return shouldFilterHit(d) ? 0 : 
		   	 	((hitviz.highlightGenes.indexOf(d.Gene) > -1) ? r(d)*3 : r(d));
		})
		.transition()
		.duration(500)
		.attr("stroke-width", 0)
		.attr("opacity", opacity);
	}
	currentHighlight = d3.select("#" + d.id)
	currentHighlight
		.transition()
		.duration(500)
		.attr("r", function(d){ 
		   	 return shouldFilterHit(d) ? 0 : r(d)*5;})
		.attr("stroke-width", 5)
		.attr("opacity",1);

}

function updateScatterView(){
	d3.selectAll(".dots")
	   .attr("stroke-width",function(d){
	   	 return (hitviz.highlightGenes.indexOf(d.Gene) > -1) ? 1 : 0;
	   })
	   .attr("r", function(d){ 
	   	 return shouldFilterHit(d) ? 0 : 
	   	 	((hitviz.highlightGenes.indexOf(d.Gene) > -1) ? r(d)*3 : r(d));
	   });
}

function makeScatterView(dataset, callback){

	d3.select("svg").remove();

	var margin = {top: 0, right: 0, bottom: 50, left: 60},
			width = 500 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;

	var xmax = d3.max(dataset, function(d){ return Math.abs(+d.UntreatedMean)}); 
	var ymax = d3.max(dataset, function(d){ return Math.abs(+d.TreatedMean)}); 
	
	xscale = d3.scale.linear().domain([0 , xmax])
		 .range([0, width]);
	yscale= d3.scale.linear().domain([0, ymax])
		.range([height, 0]);	 
	

	var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(d3.behavior.zoom().x(xscale).y(yscale).scaleExtent([1, 13]).on("zoom", zoom));

	

	svg.append("rect")
    	.attr("class", "overlay")
    	.attr("width", width)
    	.attr("height", height);

	// frequency label for trait
	/*svg.append("text")
		.attr("x",viz.padding.left)
		.attr("y",2)
		.attr("id","geneLbl")
		.style("font-size","16px")
		.text("")	*/

	var objects = svg.append("svg")
			.attr("class", "objects")
			.attr("width", width)
			.attr("height", height);
			
		//Create main 0,0 axis lines:
	  objects.append("svg:line")
			.attr("class", "axisLine hAxisLine")
			.attr("x1",0)
			.attr("y1",0)
			.attr("x2",width)
			.attr("y2",0)
			.attr("transform", "translate(0," + (yscale(0)) + ")");
	   objects.append("svg:line")
			.attr("class", "axisLine vAxisLine")
			.attr("x1",0)
			.attr("y1",0)
			.attr("x2",0)
			.attr("y2",height);

	 // define axes
	 var xAxis = d3.svg.axis()
	      .scale(xscale)
	      .orient("bottom")
	      .tickSize(-height)
	      .ticks(5)
	      .tickFormat(d3.format("s"));

	 var yAxis = d3.svg.axis()
	      .scale(yscale)
	      .orient("left")
	      .tickSize(-width)
	      .ticks(5)
		  .tickFormat(d3.format("s"));

	 var objects = svg.append("svg")
			.attr("class", "objects")
			.attr("width", width)
			.attr("height", height);

	
	 objects.selectAll(".dots")  
	   .data(dataset,key)
	   .enter()
	   .append("circle")
	   .sort(order) // sort so small bubble are on top of larger ones
	   .attr("id",function(d){ return d.id;})
	   .attr("class","dots")
	   .attr("stroke-width", 0)
	   .attr("stroke", "black")
	   .attr("opacity",.6)
	   .attr("transform", function(d) {
				return "translate("+x(d)+","+y(d)+")";
		})
	   //.attr("cx", function(d) { return x(d); })
	   //.attr("cy", function(d) { return y(d); })
	   .attr("r", function(d){ return r(d); })
	   .attr("fill", function(d,i){ return col(d); })
	   .attr("opacity",opacity)
	   .on("mouseover", function(d,i){
			callback.dataSelected(d);
		})
	   .on("mouseout", function(d,i) {
		   	callback.dataUnselected(d);
		})
	   .on("click", function(d,i){
	   	  callback.dataSelected(d);
	   	  highlightGene(d);
	   })
	   .append("title")
		.text(function(d) {
			return d.Gene;
		});

		// 45 degree line
	objects.append("line")
		.attr("opacity",.7)
		.attr("id","bisectLine")
		.attr("x1", xscale(-500)).attr("y1", yscale(-500))
		.attr("x2", xscale(500)).attr("y2", yscale(500))
	  	.attr("stroke-width", 1.5)
	  	.attr("stroke", "black");

	// fold region
	objects.append("line")
		.attr("id","foldRegion")
		.attr("x1", xscale(-500)).attr("y1", yscale(-500 * hitviz.region.fold))
		.attr("x2", xscale(500)).attr("y2", yscale(500 * hitviz.region.fold))
	  	.attr("stroke-width", 1.5)
	  	.attr("stroke", "black")
	  	.style("stroke-dasharray", ("3, 3"));

	 // y region
	objects.append("line")
		.attr("id","yRegion")
		.attr("x1", xscale(-500)).attr("y1", yscale(hitviz.region.y))
		.attr("x2", xscale(500)).attr("y2", yscale(hitviz.region.y))
	  	.attr("stroke-width", 1.5)
	  	.attr("stroke", "black")
	  	.style("stroke-dasharray", ("3, 3"));

	 // x region
	 objects.append("line")
		.attr("id","xRegion")
		.attr("x1", xscale(hitviz.region.x)).attr("y1", yscale(-500))
		.attr("x2", xscale(hitviz.region.x)).attr("y2", yscale(500))
	  	.attr("stroke-width", 1.5)
	  	.attr("stroke", "black")
	  	.style("stroke-dasharray", ("3, 3"));
		
		//Create main 0,0 axis lines:
		objects.append("svg:line")
			.attr("class", "axisLine hAxisLine")
			.attr("x1",0)
			.attr("y1",0)
			.attr("x2",width)
			.attr("y2",0)
			.attr("transform", "translate(0," + (yscale(0)) + ")");
		objects.append("svg:line")
			.attr("class", "axisLine vAxisLine")
			.attr("x1",0)
			.attr("y1",0)
			.attr("x2",0)
			.attr("y2",height);

	  svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

	 svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);


	 svg.append("text")
	    .attr("class", "x label")
	    .attr("text-anchor", "end")
	    .attr("x", width)
	    .attr("y", height + margin.bottom - 10)
	    .text("% viability, untreated");

	 svg.append("text")
	  	.attr("dy", ".75em")
	    //.attr("class", "y label")
	    .attr("text-anchor", "end")
	    .attr("transform", "rotate(-90)")
	    .attr("x", 0)
	    .attr("y",-margin.left)
	    .text("% viability, treated");


	function zoom() {
		svg.select(".x.axis").call(xAxis);
		svg.select(".y.axis").call(yAxis);


		objects.select(".hAxisLine").attr("transform", "translate(0,"+y(0)+")");
		objects.select(".vAxisLine").attr("transform", "translate("+x(0)+",0)");

		objects.select("#bisectLine")
			.attr("x1", xscale(-500)).attr("y1", yscale(-500))
			.attr("x2", xscale(500)).attr("y2", yscale(500));
		
		objects.select("#foldRegion")
			.attr("x1", xscale(-500)).attr("y1", yscale(-500 * hitviz.region.fold))
			.attr("x2", xscale(500)).attr("y2", yscale(500 * hitviz.region.fold));

		 // y region
		objects.select("#yRegion")
			.attr("x1", xscale(-500)).attr("y1", yscale(hitviz.region.y))
			.attr("x2", xscale(500)).attr("y2", yscale(hitviz.region.y));

		 // x region
		 objects.select("#xRegion")
			.attr("x1", xscale(hitviz.region.x)).attr("y1", yscale(-500))
			.attr("x2", xscale(hitviz.region.x)).attr("y2", yscale(500));

  		//svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  		svg.selectAll("circle").
  			attr("transform",function(d) {
					return "translate("+x(d)+","+y(d)+")scale(" + d3.event.scale + ")";
				});
	}
}