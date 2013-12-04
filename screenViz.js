

var diseases = {
		"OV": {title:"Ovarian with cisplatin modifier screen",
			   loc:"data/OV_screen.tsv"},
		"HNSC": {title:"Head & Neck cisplatin modifier screen",
			loc:"data/HNSC_cisplatin_rnai.tsv"},
		"BT20": { title:"BT20: Triple negative breast cancer with doxorubicin",
			loc:"data/BT20.tsv" },
		"BT549": { title:"BT549: Triple negative breast cancer with doxorubicin",
			loc:"data/BT549.tsv" },
		"MCF102A": { title:"MCF102A: Triple negative breast cancer with doxorubicin",
			loc:"data/MCF102A.tsv" },
		"MCF12A": { title:"MCF12A: Triple negative breast cancer with doxorubicin",
			loc:"data/MCF12A.tsv" }
		};
var diseaseKeys = Object.keys(diseases).sort();
var selectedDisease;

var hitviz = {
	highlightGenes:[],
	filter: { 
		ampThreshold:1,
		delThreshold:1,
		mutThreshold:1,
		pvalueThreshold:1,
		foldChangeThreshold:100},
	region: {fold:.75, y:75, x:100}};

function isInHitRegion(d){
	return d.FoldChange < hitviz.region.fold 
		&& d.UntreatedMean < hitviz.region.x
		&& d.TreatedMean < hitviz.region.y;
}

function shouldFilterHit(d){
	return (hitviz.filter.ampThreshold != 1 && 
		(!tcga_annot_map[d.Gene] || (tcga_annot_map[d.Gene].amp < hitviz.filter.ampThreshold)))
	|| (hitviz.filter.delThreshold != 1 && 
		(!tcga_annot_map[d.Gene] || (tcga_annot_map[d.Gene].del < hitviz.filter.delThreshold)))
	|| (hitviz.filter.mutThreshold != 1 
		&& (!tcga_annot_map[d.Gene] || (!(tcga_annot_map[d.Gene].mut > hitviz.filter.mutThreshold))))
	|| d.pValue > hitviz.filter.pvalueThreshold
	|| d.FoldChange > hitviz.filter.foldChangeThreshold;
}

function parseData(d){
	var count = 0;
	o = d.map(function(a){
		a.id = a.Gene + count++;
		a["TreatedMean"] = +a["TreatedMean"];
		a["UntreatedMean"] = +a["UntreatedMean"];
		a["pValue"] = +a["pValue"];
		a["FoldChange"] = +a["FoldChange"];
		return a;
	});
	return o;
}

d3.select("#chartTitle").append("text");

d3.select('#disease-menu')
.selectAll('li')
.data(diseaseKeys)
.enter()
.append('li')
.text(function(d) {return d;})
.classed('selected', function(d) {
  return d === selectedDisease;
})
.on('click', function(d) {
  selectedDisease = d;
  updateChart();
  updateMenus();
});

// gene highlighting
d3.select("#DoGeneHighlight")
	.on('click', function(d){
		hitviz.highlightGenes  = document.getElementById("geneHighlight").value.split(/[\s,]+/);
		updateScatterView();
	});

// gene filtering
d3.select("#DoGeneFilters")
	.on('click', function(d){
		hitviz.filter.ampThreshold = document.getElementById("ampThreshold").value / 100;
		hitviz.filter.delThreshold = document.getElementById("delThreshold").value / 100;
		hitviz.filter.mutThreshold = document.getElementById("mutThreshold").value / 100;
		hitviz.filter.pvalueThreshold = +document.getElementById("pvalueThreshold").value
		hitviz.filter.foldChangeThreshold = + document.getElementById("foldThreshold").value
		updateScatterView();
	});


var callback = {};
var fmt = d3.format(".2e")
callback.dataSelected = function(d){ 
	d3.select("#geneName").text(d.Gene); 
	d3.select("#foldChange").text(fmt(d.FoldChange));
	d3.select("#pvalue").text(fmt(d.pValue));
	d3.select("#mut").text(d.Gene in tcga_annot_map ? Math.round(tcga_annot_map[d.Gene].mut * 100) : "NA");
	d3.select("#del").text(d.Gene in tcga_annot_map ? Math.round(tcga_annot_map[d.Gene].del * 100) : "NA");
	d3.select("#amp").text(d.Gene in tcga_annot_map ? Math.round(tcga_annot_map[d.Gene].amp * 100) : "NA");
}

callback.dataUnselected = function(d){}

var tcga_annot_map = {};

function updateChart(){

	d3.select("svg").remove();
	d3.select("svg").append("text").text("Please wait...");

	d3.select("#chartTitle").text((selectedDisease ? diseases[selectedDisease].title : ""));

		d3.tsv("data/hnsc_trait_freqs.txt",function(tcga_annot){

		tcga_annot_map = tcga_annot.reduce(function(map, current){
			map[current.gene] = current;
			return map;
		},{});

		tsvfile = diseases[selectedDisease].loc;
		d3.tsv(tsvfile,function(dataset){
			dataset = parseData(dataset);

			//d = parseData(d, isUnivariateFlag ? univariateMap : multivariateMap);
			makeScatterView(dataset, callback);
			updateHitView(dataset);
			/*buildBubblePlot(d, isUnivariateFlag, 
				isUnivariateFlag ? xLbls[0] : xLbls[1],
				isUnivariateFlag ? yLbls[0] : yLbls[1]);
			updateMenus();*/
		}, function(error, rows) {
				console.log(rows);
		});
	});
}

function updateHitView(dataset){
	d3.select('#hitList')
      .selectAll('li').remove();

    var filteredDataset = dataset.sort(function(a,b){ return a.Gene.localeCompare(b.Gene); });
    d3.select('#hitList')
    	.selectAll('li')
    	.data(filteredDataset)
		.enter()
		.append('li')
		.classed('selected',function(d){
			return isInHitRegion(d);
		})
		.text(function(d) {return d.Gene;})
		.on('click', function(d) {
			highlightGene(d);
			callback.dataSelected(d);
		});

}

function updateMenus() {
	d3.select('#disease-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === selectedDisease;
      });
 }

