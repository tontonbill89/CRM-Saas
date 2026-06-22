document.addEventListener("DOMContentLoaded", function () {

    const allMenuItems = document.querySelectorAll(".menu > li");
    const allSubmenuItems = document.querySelectorAll(".submenu > a");

    // 🔹 CLICK SUR MENU PRINCIPAL
    document.querySelectorAll(".menu > li > a").forEach(link => {
        link.addEventListener("click", function (e) {

            const parent = this.parentElement;

            // si c'est un menu avec submenu → empêcher navigation
            if (parent.classList.contains("has-submenu")) {
                e.preventDefault();
            }

            // RESET TOTAL
            allMenuItems.forEach(item => {
                item.classList.remove("active", "open");
            });

            // ACTIVER MENU
            parent.classList.add("active");

            // SI SUBMENU → ouvrir
            if (parent.classList.contains("has-submenu")) {
                parent.classList.add("open");  
            }
            if (parent.classList.contains("submenu")) {
                parent.classList.remove("active");
            }
            
        });
    });

    // 🔹 CLICK SUR SOUS-MENU
    document.querySelectorAll(".submenu li a").forEach(link => {
        link.addEventListener("click", function () {

            const submenuItem = this.parentElement;
            const parentMenu = this.closest(".has-submenu");

            // RESET tous les sous-menus
            allSubmenuItems.forEach(item => {
                item.classList.remove("active");
            });

            // RESET menus principaux
            allMenuItems.forEach(item => {
                item.classList.remove("active");
            });

            // ACTIVER sous-menu
            submenuItem.classList.add("active");

            // ACTIVER parent
            parentMenu.classList.add("active", "open");
        });
    });

});

document.addEventListener("DOMContentLoaded", function () {

    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    // bouton toggle sidebar
    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        overlay.classList.toggle("active");
    });

    // fermer sidebar en cliquant sur overlay (mobile)
    overlay.addEventListener("click", function () {
        sidebar.classList.remove("collapsed");
        overlay.classList.remove("active");
    });

});