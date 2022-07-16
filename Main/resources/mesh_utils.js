function nvr() {
	this.x = 0;
	this.y = 0;
	this.z = 0;            // x, y e z vengono letti
	this.n_neigh = 0;      // numero di vertici del primo ring
	this.neigh = new Int32Array(MAXVAL);
	this.edge = new Int32Array(MAXVAL);
	this.face = new Int32Array(MAXVAL);
	this.val = 0;          // valenza del vertice
	this.bound = null;     // flag se e' di bordo
	this.vind = 0;         // se il vertice e' straordinario, e' l'indice del vertice nella lista dei vertici straordinari
  } ;
  
  function ndg() {
	this.neigh = new Int32Array(2);
	this.vert = new Int32Array(2); 
	this.val = 0;          // indica la valenza del lato; se di bordo o meno
  };
  
  function nfc() {
	this.n_v_e=0;          // numero vertici o lati; viene letto
	this.neigh = new Int32Array(MAXVAL);
	this.edge = new Int32Array(MAXVAL);
	this.vert = new Int32Array(MAXVAL);   // vert; viene letto
	this.val=0;            // valenza della face; numero di facce del primo ring
	this.bound=null;       // flag se e' di bordo
	this.find=null;        // se la faccia non e' quadrilatera, e' uguale al numero di vertici straordinari nella mesh originale +
						   // indice della faccia nella lista delle facce non quadrilatere
	this.textCoordsIndex = new Array();		    //indice texture associate ai vertici della faccia
	this.normalVertexIndex = new Array();			//indice normali associate ai vertici della faccia
	this.normalFaceIndex = 0;								  //indice della normale associata alla faccia
	this.group = 0;			  //indice gruppo di appartenenza
	this.material = 0;		//indice materiale di appartenenza
  };
  
  
  function subd_mesh() {
	this.nvert = 0;           /* num. of vertices */
	this.nedge = 0;           /* num. of edges */
	this.nface = 0;           /* num. of faces */
	this.vert = new Array();           /* mesh vertices [1..nvert] */
	this.edge = new Array();           /* mesh edges [1..nedge] */
	this.face = new Array();           /* mesh faces[1..nface] */
	this.textCoords = new Array();
	this.normal = new Array();
	this.facetnorms = new Array();
	this.groups = new Array();
	this.materials = new Array();
};

function Grid_data() {  // mesh (grid) data
   this.npolygons;      // numero di poligoni
   this.firstv;         // per ogni poligono indice del primo vertice nel vettore dei nodi
                        // il numero di vertici per poligono e' determinato da firstv[i+1] - firstv[i];
                        // la lunghezza di firstv e' npolygons + 1.
                        // firstv[0] = 0
                        // firstv[npolygons] = lunghezza del vettore node_index.
                        // node_index[firstv[i]] .. node_index[firstv[i+1]-1] sono i nodi del poligono i
                        // i sta nell'intervallo [0 .. npolygons-1]
   this.node_index = [];// per ogni vertice indice nel vettore dei nodi

   this.nnodes;         // numero di nodi
   
   this.nodes = [new Float64Array(3)];
};

function work_area() {
  this.n = 0;
  this.vedge = [];
  this.epos = [];
  this.f1pos = [];
  this.f2pos = [];
} ;
	

//insieme di function per gestire una mesh dopo che è stata caricata
//con glmReadOBJ

var mesh = new subd_mesh();

function swap_int(a, b) {
	return [b, a];
}

//cerca nella struttura vert_face un dato indice di faccia
function find_in_vert_face(vert,ind_vert, ind_face)
{
var k,nval;
        if (vert[ind_vert].bound)
		nval=vert[ind_vert].val-1;
	else
		nval=vert[ind_vert].val;
	for (k=0; k<nval; k++)
		if (vert[ind_vert].face[k]==ind_face)
				break;
	return(k);
}

//cerca nella struttura face un dato indice di vertice
function find_in_face(face,ind_face, ind_vert)
{
var k;
	for (k=0; k<face[ind_face].n_v_e; k++)
		if (face[ind_face].vert[k]==ind_vert)
				break;
	return(k);
}

function convert_obj2grid_data(model,gc_grid) {
var i,j;
var nvf;
var grid;

    grid = new Grid_data();
    if (!grid) console.log("No memory");
    grid.nnodes = model.numvertices;
    grid.npolygons = model.numtriangles;

	for (var h=0; h<grid.nnodes*3;h++)
		grid.nodes.push(new Array(3));
    if (!grid.nodes) console.log("No memory");

    grid.firstv = new Int32Array(grid.npolygons+1);
    if (!grid.firstv) console.log("No memory");
    nvf=0;
    console.log("N.lati di ogni faccia; N.facce",model.numtriangles);
    for (i=0; i<model.numtriangles; i++)
        nvf += model.triangles[i].nv;
    console.log("N.lati di ogni faccia; ",nvf);
    grid.firstv[grid.npolygons]=nvf;

    grid.node_index = new Int32Array(nvf);
    if (!grid.node_index) console.log("No memory");

    for (i=1; i<=model.numvertices; i++){
        grid.nodes[i-1][0]=model.vertices[3 * i + 0];
        grid.nodes[i-1][1]=model.vertices[3 * i + 1];
        grid.nodes[i-1][2]=model.vertices[3 * i + 2];
    }

    nvf=0;
    grid.firstv[0] = 0;
    for (j=0; j<model.triangles[0].nv; j++){
       grid.node_index[nvf]=model.triangles[0].vindices[j]-1;
       nvf++;
    }
    
    for (i=1; i<model.numtriangles; i++){
        grid.firstv[i] = grid.firstv[i-1]+model.triangles[i-1].nv;
        for (j=0; j<model.triangles[i].nv; j++){
            grid.node_index[nvf]=model.triangles[i].vindices[j]-1;
	          nvf++;
	      }
    }

    gc_grid=grid;

    return gc_grid;
}

function convert_grid_data2mesh(grid,mesh) {

       if(mesh) {
	       mesh = null;
      }
	    mesh = new subd_mesh();
      if (!mesh) console.log("No memory");
      mesh.nvert = grid.nnodes;
      mesh.nface = grid.npolygons;
     
      mesh.vert  = new Array(mesh.nvert+1);
 
      for (var h = 0; h<mesh.nvert+1; h++) 
	     mesh.vert[h] = new nvr();
      
      mesh.face = new Array(mesh.nface+2);
      for (var h = 0; h<mesh.nface+2; h++)
		  mesh.face[h]=new nfc();

// i vertici vanno caricati in ogni caso
    for (i=1; i<=mesh.nvert; i++){
         mesh.vert[i].x=grid.nodes[i-1][0];
         mesh.vert[i].y=grid.nodes[i-1][1];
         mesh.vert[i].z=grid.nodes[i-1][2];
     }

   // se nuova griglia ricalcolo la subd_mesh
    jjj=0;
    for (i=1; i<=mesh.nface; i++){
	      mesh.face[i].n_v_e=grid.firstv[i]-grid.firstv[i-1];

        for (j=0; j<mesh.face[i].n_v_e; j++){
	        mesh.face[i].vert[j]=grid.node_index[jjj]+1;
		      jjj++;
	      }
	  }

  return mesh;
}

// prende in input la subd_mesh "mesh" con vertici e facce
// e riempie tutti i campi previsti per la struttura subd_mesh
function LoadSubdivMesh(mesh) {
var nvert, nedge, nface, nval;
var vert;
var edge = [];
var face;

var buf = [];
var count_fe;
var coppie = new Int32Array(2*MAXVAL), ic,il;
var i,j,k,l,ii,jj,kk,ij,i_st,i_en,ijc;

nvert=mesh.nvert;
nface=mesh.nface;
vert=mesh.vert;
face=mesh.face;

//alloco una struttura di lavoro che vado a riempire e sfruttando la
//quale posso poi riempire agevolmente le strutture EV, EF, VE
    for (var h=0; h<mesh.nvert+1;h++) {
      buf.push(new work_area());
    }
    if (!buf) console.log("No memory");

    for (k=1; k<=nvert; k++){
       buf[k].n = 0;
       buf[k].vedge=new Int32Array(MAXVAL);
       buf[k].epos =new Int32Array(MAXVAL);
       buf[k].f1pos=new Int32Array(MAXVAL);
       buf[k].f2pos=new Int32Array(MAXVAL);

       if (buf[k].vedge==null || buf[k].epos==null || buf[k].f1pos==null || buf[k].f2pos==null)
	       console.log(k, "Non sono riuscito ad allocare memoria");
    }
    nedge=1; 
    for (k=1; k<=nface; k++){
       for (ii=0; ii<mesh.face[k].n_v_e; ii++){
		     i_st=ii;
		     i_en=(ii+1) % mesh.face[k].n_v_e;

//controllo che non esista già memorizzato l'Edge di mesh.vertici invertiti
		     i=mesh.face[k].vert[i_en];
		     kk=buf[i].n;
		     j=0;
		     while (j<kk && buf[i].vedge[j]!=mesh.face[k].vert[i_st])
                     j++;
//congettura: se il mesh.vertice non viene trovato con gli indici inmesh.vertiti
//vuol dire che non e' stato nemmeno memorizzato con i mesh.vertici dritti.
//controllo che non esista già memorizzato l'Edge di mesh.vertici dritti
		    if(j==kk){
                 i=mesh.face[k].vert[i_st];
                 kk=buf[i].n;
                 j=0;
                 while (j<kk && buf[i].vedge[j]!=mesh.face[k].vert[i_en])
                     j++;
		
                 if(j==kk){
		               buf[i].vedge[kk]=mesh.face[k].vert[i_en];
		               buf[i].epos[kk]=nedge;
		               buf[i].f1pos[kk]=k;
		               nedge++;
		               buf[i].n++;
                 }
		   }
		   else
		     buf[i].f2pos[j]=k;
	    }
    }
    nedge--;
    mesh.nedge = nedge;

    for (var h=0; h<nedge+1; h++){
	      edge.push(new ndg());
        mesh.edge.push(new ndg());
    }

    if (!mesh.edge) console.log("No memory");
    if(edge == null)
       console.log("NON sono riuscito ad allocare memoria\n");	   

//alloco un array di contatori temporaneo
    count_fe = new Int32Array(mesh.nvert+1);	
    for (k=1; k<=nface; k++){
       for (ii=0; ii<mesh.face[k].n_v_e; ii++){
	        kk=mesh.face[k].vert[ii];
	        if(buf[kk].vedge[count_fe[kk]]==mesh.face[k].vert[(ii+1)%mesh.face[k].n_v_e]){
            mesh.face[k].edge[ii]=buf[kk].epos[count_fe[kk]];
	          count_fe[kk]++;
	        }
	        else{
	          i=0;
	          kk=mesh.face[k].vert[(ii+1)%mesh.face[k].n_v_e];
	          while(i<buf[kk].n && buf[kk].vedge[i]!=mesh.face[k].vert[ii])
	          i++;
	          mesh.face[k].edge[ii]=buf[kk].epos[i];
	        }

	      }
     }
//Inizializzo le valenze dei vertici a zero
    for (k=1; k<=nvert; k++){
	    mesh.vert[k].val=0;
	    mesh.vert[k].bound=false;
    }
//Scorro la struttura di lavoro buf e riempio le strutture
//edge[].vert[] (EV)
//edge[].neigh[] (EF)
//mesh.vert[].edge[] (VE) 
//face[].edge[] (FE)
//e i campi
//edge[].val (che mi informa se un edge è di bordo o meno)
//mesh.vert[].val (valenza di un mesh.vertice)
//Nota: in VE ci sono indici positivi e negativi di edge;
//se mesh.vert[i].edge[k] è positivo vuol dire che l'edge memorizzato
//ha come primo estremo il mesh.vertice di indice 'i', se invece è negativo vuol dire che
//il mesh.vertice di indice 'i' e' il secondo estremo dell'edge.
//praticamente riesco a memorizzare l'orientamento dell'edge
//che mi sembra molto importante e viene sfruttato poi per mettere
//in senso antiorario sia la lista VV che FF.
   for (k=1; k<=nvert; k++) {
      for (i=0; i<buf[k].n; i++) {
        mesh.edge[buf[k].epos[i]].vert[0]=k;
        mesh.edge[buf[k].epos[i]].vert[1]=buf[k].vedge[i];
        j=buf[k].f1pos[i];
        mesh.edge[buf[k].epos[i]].neigh[0]=j;
        mesh.edge[buf[k].epos[i]].val=1;

        j=buf[k].f2pos[i];
	      if (j>0) {
          mesh.edge[buf[k].epos[i]].neigh[1]=j;
          mesh.edge[buf[k].epos[i]].val++;
	      }
	      else
	        mesh.edge[buf[k].epos[i]].neigh[1]=0;

	      mesh.vert[k].edge[mesh.vert[k].val]=buf[k].epos[i];
	      mesh.vert[k].val++;
	      j=buf[k].vedge[i];

	      mesh.vert[j].edge[mesh.vert[j].val]=-buf[k].epos[i];
	      mesh.vert[j].val++;
    }
   }
//dealloco l'array count_fe
   count_fe = null;

//Controllo se un mesh.vertice e' di bordo:
//un mesh.vertice e' di bordo se appartiene a un edge di bordo, 
//cioe' con val=1
//Riempio mesh.vert.bound
//Riempio mesh.vert.val
//GC: secondo me basta fare un ciclo sugli edge;
// se l'edge e' di bordo, mettere mesh.vert[i].bound a TRUE
 for(k=1; k<=nedge; k++){
     if(mesh.edge[k].val==1){
          mesh.vert[mesh.edge[k].vert[0]].bound = true;
          mesh.vert[mesh.edge[k].vert[1]].bound = true;
     }
}

//Ora che ho la lista, per ogni mesh.vertice, degli edge (VE) li vorrei ordinare 
//in senso antiorario;
//l'unico modo che vedo è costruire una catena ordinate di facce usando la lista EF
//copio gli EF in un array di coppie di indici di facce e ordino le coppie per fare
//una catena continua e a giro; tengo conto di eventuali edge di bordo controllando
//se hanno una sola faccia adiacente
   var tmp = [];
   for(i=1; i<=nvert; i++){
           ic=0;
	   for (k=0; k<mesh.vert[i].val; k++){
		   j=mesh.vert[i].edge[k];
		   if (j>0){
		      if (mesh.edge[j].neigh[1]==0){
			      coppie[ic]=coppie[0];
			      ic++;
			      coppie[ic]=coppie[1];
			      ic++;
			      coppie[0]=mesh.edge[j].neigh[1];
			      coppie[1]=mesh.edge[j].neigh[0];

			      tmp=swap_int((mesh.vert[i].edge[k]),(mesh.vert[i].edge[0]));
			      mesh.vert[i].edge[k]=tmp[0];
			      mesh.vert[i].edge[0]=tmp[1];
		      }
		      else
		      {
			      coppie[ic]=mesh.edge[j].neigh[1];
			      ic++;
			      coppie[ic]=mesh.edge[j].neigh[0];
			      ic++;
		      }
		   }
		   else
		   {
		      if (mesh.edge[-j].neigh[0]==0){
			      coppie[ic]=coppie[0];
			      ic++;
			      coppie[ic]=coppie[1];
			      ic++;
			      coppie[0]=mesh.edge[-j].neigh[0];
			      coppie[1]=mesh.edge[-j].neigh[1];

			      tmp=swap_int((mesh.vert[i].edge[k]),(mesh.vert[i].edge[0]));
			      mesh.vert[i].edge[k]=tmp[0];
			      mesh.vert[i].edge[0]=tmp[1];
		      }
		      else
		      {
			      coppie[ic]=mesh.edge[-j].neigh[0];
			      ic++;
			      coppie[ic]=mesh.edge[-j].neigh[1];
			      ic++;
		      }
		   }
           }
	   for (k=0; k<mesh.vert[i].val-1; k++)
		   for (j=k+1; j<mesh.vert[i].val; j++){
			   if (coppie[2*k+1]==coppie[2*j])
			   {
			      tmp=swap_int(coppie[2*(k+1)],coppie[2*j]);
			      coppie[2*k+1]=tmp[0];
			      coppie[2*j]=tmp[1];
			      tmp=swap_int(coppie[2*(k+1)+1],coppie[2*j+1]);
			      coppie[2*(k+1)+1]=tmp[0];
			      coppie[2*j+1]=tmp[1];
		              tmp=swap_int((mesh.vert[i].edge[k+1]),(mesh.vert[i].edge[j]));
			      mesh.vert[i].edge[k+1]=tmp[0];
			      mesh.vert[i].edge[j]=tmp[1];
		              j=mesh.vert[i].val;
			   }
		   }

	   if (mesh.vert[i].bound)
	   {
		   mesh.vert[i].face[0]=coppie[1];
		   j=1;
	   }
	   else
	   {
		   mesh.vert[i].face[0]=coppie[0];
		   mesh.vert[i].face[1]=coppie[1];
		   j=2;
	   }
	   for (k=1; k<mesh.vert[i].val-1; k++)
	   {
		   mesh.vert[i].face[j]=coppie[2*k+1];
		   j++;
	   }

//A partire dai VF e dalle FV che sono entrambe gia' in senso antiorario
//estraggo nello stesso senso i neigh dei mesh.vertici (VV)
//nota che se il mesh.vertice è di bordo le facce in VF sono una in meno della valenza
   ic=0;
   il=0;
   if (mesh.vert[i].bound)
     for (k=0; k<mesh.vert[i].val-1; k++)
     {
	   jj=mesh.vert[i].face[k];
	   if (k==0)
	     ii=find_in_face(mesh.face,jj,i);
	   else
	     ii=find_in_face(mesh.face,jj,mesh.vert[i].neigh[ic-1]);
	   for (l=1; l<mesh.face[jj].n_v_e-il; l++)
	   {
		   mesh.vert[i].neigh[ic]=mesh.face[jj].vert[(l+ii)%mesh.face[jj].n_v_e];
		   ic++;
	   }
	   il=1;
     }
   else
     for (k=0; k<mesh.vert[i].val; k++)
     {
	   jj=mesh.vert[i].face[k];
	   if (k==0)
	     ii=find_in_face(mesh.face,jj,i);
	   else
	     ii=find_in_face(mesh.face,jj,mesh.vert[i].neigh[ic-1]);
	   for (l=1; l<mesh.face[jj].n_v_e-il; l++)
	   {
		   mesh.vert[i].neigh[ic]=mesh.face[jj].vert[(l+ii)%mesh.face[jj].n_v_e];
		   ic++;
	   }
	   il=1;
	   if (k==mesh.vert[i].val-2)
	     il=2;
     }
   mesh.vert[i].n_neigh=ic;
   }

//Controllo se una faccia e' di bordo
//Riempio face.bound
//Una faccia e' di bordo se ha un mesh.vertice di bordo
//GC: anche qui dovrebbe bastare un ciclo sui mesh.vertici e se questo
//e' di bordo si etichettano tutte le facce di cui lui e' mesh.vertice
// come di bordo. Sappiamo gia' le facce adiacenti di un mesh.vertice?
  for(i=1; i<=nface; i++)
   {
	mesh.face[i].bound = false;
	j=0;
	while( (j<mesh.face[i].n_v_e)&&(!mesh.face[i].bound) )
	{
		if(mesh.vert[mesh.face[i].vert[j]].bound)
			mesh.face[i].bound = true;
		j++;
	}
   }	
	
//Cerco infine per ogni faccia, le facce che la circondano in senso antiorario (FF).
//se la faccia è di bordo bisogna iniziare da una intorno di bordo.
//la procedura è simile a trovare i mesh.vertici intorno ad un mesh.vertice; usero'
//cioe' la lista Face per avere i mesh.vertici di una faccia e per ognuno dalla
//lista VF estraggo a giro le facce.
   for(i=1; i<=nface; i++)
   {
      ic=0;
      il=0;
      ij=0;

      if (mesh.face[i].bound)
      {
//ricerca dell'ultimo mesh.vertice di bordo della face
//una volta trovato uno di bordo, il ciclo while che
//segue scorre gli eventuali mesh.vertici di bordo
//a lui adiacenti nell'ordine antiorario
      ij=0;
      while(!mesh.vert[mesh.face[i].vert[ij]].bound)
        ij++;
//aggiunto contatore ijc per evitare ciclo infinito se tutti i mesh.vertici di
//una faccia sono di bordo
      ijc=1;
      while(mesh.vert[mesh.face[i].vert[(ij+1)%mesh.face[i].n_v_e]].bound && ijc<=mesh.face[i].n_v_e)
         {
         ij=(ij+1)%mesh.face[i].n_v_e;
         ijc++;
	 }
      }

/*versione nuova per gestire ring di una faccia di bordo con discontinuita'
  delle facce intorno*/
      for (j=0; j<mesh.face[i].n_v_e; j++)
      {
        jj=mesh.face[i].vert[(j+ij)%mesh.face[i].n_v_e];
        if (mesh.vert[jj].bound)
                 nval=mesh.vert[jj].val-1;
        else
                 nval=mesh.vert[jj].val;
//cerco l'indice della faccia attuale nel ring di facce del mesh.vertice jj
        ii=find_in_vert_face(mesh.vert,jj,i);
//esamino le facce del ring del mesh.vertice jj a partire dalla successiva alla i
//e la inserisco se non gia' precedentemente inserita
        for (l=1; l<nval; l++)
          {
                if (ic!=0)
                  {
                   if(mesh.vert[jj].face[(l+ii)%nval]!=mesh.face[i].neigh[ic-1])
                   {
                     mesh.face[i].neigh[ic]=mesh.vert[jj].face[(l+ii)%nval];
                     ic++;
                   }
                  }
                else
                  {
		     mesh.face[i].neigh[ic]=mesh.vert[jj].face[(l+ii)%nval];
		     ic++;
		  }
          }
      }
//test finale per evitare che l'ultima faccia sia ripetuta rispetto alla prima
      if(ic>1 && mesh.face[i].neigh[0]==mesh.face[i].neigh[ic-1])
        ic--;

      mesh.face[i].val=ic;
   }
    buf = null;
    return mesh;
}
