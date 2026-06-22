document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");
    const overlay = document.getElementById("overlay");

    toggleBtn.addEventListener("click", () => {

        // MOBILE
        if(window.innerWidth <= 992){

            sidebar.classList.toggle("mobile-show");
            overlay.classList.toggle("active");

        }else{

            // DESKTOP
            sidebar.classList.toggle("collapsed");
        }
    });

    // FERMETURE MOBILE
    overlay.addEventListener("click", () => {

        sidebar.classList.remove("mobile-show");
        overlay.classList.remove("active");
    });
});