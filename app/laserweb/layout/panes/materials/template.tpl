<style>
.mbutton {
	background-color: green;
	color: white;
	border-radius: 3px;
	border: 1px solid black;
	font-size: 12px;
	width: 25px;
	padding: 2px;
}
table {
	border-collapse: collapse;
}
</style>

<template id="layout-materials-pane">
	<table id="materials-root">
		<thead><tr> Material Presets</tr>
			<tr>
				<td>Material Name</td>
				<td colspan=3>Settings</td>
			</tr>
			<tr>
				<td></td>
				<td>cuts</td>
				<td>speed</td>
				<td>power</td>
			</tr>
		</thead>
		<tbody data-bind="foreach: { data: materialList, as: 'material'}">

			<tr>
				<td data-bind="attr: { rowspan: material.settingCount }"><input data-bind="text: material.name"></td></tr>
			<!-- ko foreach: {data: materialSettings, as: 'settings'} -->
			<tr>
				<td><input class=".mtable" data-bind="text: material.name"></td>
                                <td><input class=".mtable" data-bind="text: settings.speed"></td>
                                <td><input class=".mtable" data-bind="text: settings.power"></td>
                                <td><button class="mbutton" data-bind="click: material.removeLaserSetting">-</button>
			</tr>
			<!-- /ko -->
			<tr>
				<td><button class="mbutton" data-bind="click: material.addLaserSetting">+</button></td>
			</tr>
		</tbody>
	</table>
	<button data-bind="click: $root.addMaterial" class="mbutton">Add Material</button>
</template
