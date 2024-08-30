import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuFileEdit, LuFileSearch, LuFolder, LuGithub, LuBug } from "react-icons/lu";
import { motion } from 'framer-motion';
import logoImage from '../img/slime.png';
import '../styles/global.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const sidebarVariants = {
    hidden: { x: -250 },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      className="sidebar"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div 
        className="sidebar-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="sidebar-logo-container">
          <motion.img 
            src={logoImage} 
            alt="Slime Logo" 
            className="sidebar-logo"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
        </div>
      </motion.div>
      <nav className="sidebar-nav">
        <ul>
          {[
            { path: '/', icon: LuFileEdit, text: 'Create Finding' },
            { path: '/view-findings', icon: LuFileSearch, text: 'View Findings' },
            { path: '/projects', icon: LuFolder, text: 'Projects' },
          ].map((item, index) => (
            <motion.li 
              key={item.path}
              variants={linkVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link to={item.path} className={`sidebar-link ${isActive(item.path)}`}>
                <item.icon className="sidebar-icon" />
                <span className="sidebar-link-text">{item.text}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
      <motion.div 
        className="sidebar-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { href: "https://github.com/loosehose/slime", icon: LuGithub, tooltip: "GitHub Repository" },
          { href: "https://github.com/loosehose/slime/issues", icon: LuBug, tooltip: "Report a Bug" },
        ].map((item, index) => (
          <motion.a 
            key={item.href}
            href={item.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="icon-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <item.icon />
            <span className="tooltip">{item.tooltip}</span>
          </motion.a>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;