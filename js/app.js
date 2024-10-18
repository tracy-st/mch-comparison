
(async function() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        const products = data.products;

        const product1Select = document.getElementById('product1');
        const product2Select = document.getElementById('product2');
        const submitButton = document.getElementById('submitButton');
        const tableBody = document.getElementById('comparisonTable').querySelector('tbody');

        // Populate dropdowns with product names
        products.forEach((product, index) => {

            const option1 = document.createElement('option');
            option1.value = index;
            option1.textContent = product.name;
            product1Select.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = index;
            option2.textContent = product.name;
            product2Select.appendChild(option2);
        });

        function disableFirstOption() {
            const firstOption = product1Select.options[0];
            if (dropdown.selectedIndex !== 0) {
                firstOption.disabled = true;
            }
        }

        function populateTable(productA, productB) {
            const product1title = document.getElementById('object1');
            const product2title = document.getElementById('object2');
            product1title.innerHTML = ''; // Clear existing title
            product2title.innerHTML = ''; // Clear existing title
            product1title.innerHTML = `${productA.name}`;
            product2title.innerHTML = `${productB.name}`;

            tableBody.innerHTML = ''; // Clear existing rows

            // Create a row for the images
            const imageRow = document.createElement('tr');
            imageRow.innerHTML = `<td></td>
                                  <td class="object"><img src="${productA.thumbUrl}" alt="${productA.name}"></td>
                                  <td class="object"><img src="${productB.thumbUrl}" alt="${productB.name}"></td>
                                  <td></td>`;
            tableBody.appendChild(imageRow);

            const accRow = document.createElement('tr');
            accRow.innerHTML = `<td>Accession no.</td>
                                  <td class="object">${productA.accessionNumber}</td>
                                  <td class="object">${productB.accessionNumber}</td>
                                  <td>Accession no.</td>`;
            tableBody.appendChild(accRow);

            const linkRow = document.createElement('tr');
            linkRow.innerHTML = `<td>Link</td>
                                  <td class="object"><a href="https://mappingcolor.fas.harvard.edu/works/${productA.slug}" target="_blank">View on MCH</td>
                                  <td class="object"><a href="https://mappingcolor.fas.harvard.edu/works/${productB.slug}" target="_blank">View on MCH</td>
                                <td>Link</td>`;
            tableBody.appendChild(linkRow);

            // Collect all unique color names from both products
            const allColorNames = new Set();
            [productA, productB].forEach(product => {
                Object.keys(product.specs).forEach(color => {
                    allColorNames.add(color);
                });
            });

            // Iterate over all colors and compare specs
            allColorNames.forEach(color => {               
                const row = document.createElement('tr');
                row.innerHTML = `<td style="border-right: 20px solid ${color}">${color}</td>`;

                [productA, productB].forEach(product => {
                    const colorSpecs = product.specs[color] || [];
                    if (colorSpecs.length > 0) {
                        const specDetails = colorSpecs.map(spec => {
                            const pigmentNames = spec.visiblecolorpigmentSet.map(p => p.pigment.name).join(', ');
                            const elementDetails = spec.visiblecolorelementSet.map(e => `${e.element.name} (${e.amount})`).join(', ');
                            return `
                               <p><strong>Pigments:</strong> ${pigmentNames || 'No pigments'}</p>
                                <p><strong>Elements:</strong> ${elementDetails || 'No elements'}</p>
                            `;
                        }).join('<hr>');
                        row.innerHTML += `<td>${specDetails}</td>`;
                    } else {
                        row.innerHTML += `<td>No data available</td>`;
                    }
                });
                row.innerHTML += `<td style="border-left: 20px solid ${color}">${color}</td>`;
                tableBody.appendChild(row);
            });
        }

        // Initial population of the table with the first two products
        // populateTable(products[0], products[1])

        // Add event listeners to update the table based on dropdown selection


        submitButton.addEventListener('click', () => {
            const productA = products[product1Select.value];
            const productB = products[product2Select.value];
            populateTable(productA, productB);
        });

    } catch (error) {
        console.error('Error loading JSON data:', error);
    }
})();