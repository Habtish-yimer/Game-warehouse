
function RandomGenerator(seed)
{
	this.z = seed;
	this.w = -seed;
}

RandomGenerator.prototype.next = function()
{
	this.z = 36969 * (this.z & 65535) + (this.z >> 16);
	this.w = 18000 * (this.w & 65535) + (this.w >> 16);
	
	return Math.abs((this.z << 16) + this.w);  /* 32-bit result */
}

RandomGenerator.prototype.nextNumber = function()
{
	return this.next() / 0xFFFFFFFF;
}

RandomGenerator.prototype.nextInteger = function(max)
{
	return this.next() % max;
}

function ShelvesRenderer(rendererState)
{
	this.assets = rendererState.assets;
	this.scene = rendererState.scene;
	
	this.shelves = [
		this.assets.get('shelf-long-boxes'),
		this.assets.get('shelf-long-crates'),
		this.assets.get('shelf-long-barrels'),
		this.assets.get('barrel-blue'),
		this.assets.get('barrel-red')
	]
}

ShelvesRenderer.prototype.add = function(assetIndex, pos_x, pos_y, angle)
{
	var shelve = this.shelves[assetIndex];
	
	var mesh = new THREE.Mesh(shelve.geometry, shelve.material);
	mesh.castShadow    = true;
	mesh.receiveShadow = true;
	mesh.position.x = pos_x;
	mesh.position.y = pos_y;
	mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), D2R(angle));
	
	// Create mesh for shelf
	this.scene.add(mesh);
}

function ShelvesController(seed, region, density, worldState, renderer)
{
	this.random = new RandomGenerator(seed);
	
	this.worldState = worldState;
	this.renderer = renderer;
	
	this.region = region;
	this.density = density;
	
	this.shelve_size = 8;
	this.grid_width  = Math.floor( (this.region[1].x - this.region[0].x)/this.shelve_size );
	this.grid_height = Math.floor( (this.region[1].y - this.region[0].y)/this.shelve_size );
}

ShelvesController.AssetIndices = [0, 1, 0, 2, 0, 0, 3, 2, 0, 1, 0, 3, 4, 0, 4, 0];

ShelvesController.prototype.generateShelveAtPosition = function(pos_x, pos_y, angle, type_of_shelve)
{
	var assetIndex = ShelvesController.AssetIndices[type_of_shelve];
	
	if (this.renderer)
		this.renderer.add(assetIndex, pos_x, pos_y, angle);
	
	var position = new CANNON.Vec3(pos_x, pos_y, 0);
	
	var boxsize = (angle == 270 || angle == 0 ? new CANNON.Vec3(this.shelve_size/2,this.shelve_size/3,100) : new CANNON.Vec3(this.shelve_size/3,this.shelve_size/2,100) );
	var mass = (assetIndex == 3 || assetIndex == 4) ? 2000 : 0;
	
	this.worldState.addBoxGeometry(position, boxsize, mass, "");
}

ShelvesController.prototype.generateHorizontalLines = function()
{	
	var n_shelve_lines_max = this.grid_height/2;
	var n_shelve_lines_min = 1;
	var n_shelve_lines     = Math.floor( n_shelve_lines_max*this.density + n_shelve_lines_min*(1-this.density) );
	var start_idx_x        = 2;
	var end_idx_x		   = this.grid_width - 2;
	var half_x 			   = (end_idx_x - start_idx_x)/2
	var dy 				   = Math.floor(this.grid_height / n_shelve_lines); 
	
	for(var i=1; i<=n_shelve_lines; i++){
		for(var j=start_idx_x; j<end_idx_x; j++){
			if(j>half_x-2 && j <half_x+1) continue;
			
			this.generateShelveAtPosition(this.region[0].x + j*this.shelve_size, this.region[0].y + i*dy*this.shelve_size, 270 ,this.random.nextInteger(5));
		}
	}
}

function ClutterController(seed, region, density, worldState, renderer){
	this.random = new RandomGenerator(seed);
	this.worldState = worldState;
	this.renderer = renderer;
	
	this.region = region;
	this.density = density;
}

ClutterController.prototype.add = function(position, type){

	if(this.renderer){
		this.renderer.add(position, type); //Add to the clutter renderer
	}

	var boxsize = new CANNON.Vec3(1,1,1);

	this.worldState.addBoxGeometry(position, boxsize, 1700, "");
}

ClutterController.REGION_DIVISION_SIZE = 1.0;
ClutterController.GenerateLotsOfClutter = function(){

	var horzDivisions = this.region[0].x/ClutterController.REGION_DIVISION_SIZE;
	var vertDivisions = this.region[0].y/ClutterController.REGION_DIVISION_SIZE;

	var sinStartHorz1 = Math.Random();
	var sinStartVert1 = Math.Random();
	var sinStartHorz2 = Math.Random();
	var sinStartVert2 = Math.Random();

	for(var i = 0; i < horzDivisions; i++){
		var horzProb1 = Math.sin(i/this.region[0].x + sinStartHorz1);
		var horzProb2 = Math.sin(i/this.region[0].x + sinStartHorz2);
		var horzProb = (horzProb1 + horzProb2)/2.0;
		for(var j = 0; j < vertDivisions; j++){
			var vertProb1 = Math.sin(j/this.region[0].y + sinStartVert1);
			var vertProb2 = Math.sin(j/this.region[0].y + sinStartVert2);
			var vertProb = (vertProb1 + vertProb2)/2.0;

		}
	}

	var position = new CANNON.Vec3(0,0,0);
	var type = [];

	position.x = Math.random() * this.region[0].x;
	position.y = Math.random() * this.region[0].x;
	position.z = 2;

	var type = Math.random() * 4;
}

function ClutterRenderer(rendererState){
	this.assets = rendererState.assets;
	this.scene = rendererState.scene;

	this.clutter = [
		this.assets.get('barrel-red'),
		this.assets.get('barrel-blue'),
		this.assets.get('box'),
		this.assets.get('crate'),
	]

	this.clutterMeshes = [];

	for(var i = 0; i < this.clutterMeshes.length, i++){
		this.clutter[i].material
		var newMesh = new THREE.Mesh(this.clutter[i].geometry, this.clutter[i].material);
		newMesh.castShadow    = true;
		newMesh.receiveShadow = true;
		clutterMeshes.push(newMesh);
	}
}

ClutterRenderer.prototype.add = function(position, typeofclutter){
	var clutter = this.clutterMeshes[typeofclutter];

	clutter.position.x = position.x;
	clutter.position.y = position.y;
	clutter.position.z = position.z;

	this.scene.add(clutter);
}
