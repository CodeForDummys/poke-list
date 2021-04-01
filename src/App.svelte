<script>
import { onMount } from "svelte";
import { each } from "svelte/internal";
import Pokemon from './Pokemon.svelte';
import axios from 'axios';
const data = '/json/001-100.json';
const url = 'http://localhost:58645/';
let pkmn;

	const all = [ ...Array(24).keys() ].map( i => i+1);


	let currentPkmn;

	$: currentPkmn = 'pikachu';
	
	let isValid = false;

	// let all = '?limit=10220';
	
	const algo = () => {
		isValid = !isValid;
	}

	const s = async () => {
		pkmn = (await axios.get(url+data)).data;
		console.log(pkmn);
	}


</script>



<div class="container2">
	<form on:submit|preventDefault={algo}>
		<h1>Pokemon elegido</h1>
		{#if  isValid}
			<Pokemon id={currentPkmn} />
		{:else}
			<Pokemon id={currentPkmn} />
		{/if}
		<div>
			<input bind:value="{currentPkmn}" type="text" placeholder="escribe el numbero de pokedex">
			<button>Buscar</button>
		</div>
		<div>
			<button on:click="{s}">Buscar</button>
		</div>
	</form>
</div>

<div class="container">
	{#each all as pkmn}
		<Pokemon id={Math.floor(Math.random() * 898)}/>
	{/each}
</div>

<style>
	.container {
		display: inline-flex;
		flex-wrap: wrap;
		justify-content:center;
  		gap: 20px;
	}

	.container2 {
		display: inline-flex;
		flex-wrap: wrap;
		justify-content:center;
  		gap: 20px;
		width: 100%;
		margin-bottom: 20px;
	}


</style>